using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Infrastructure.ExchangeRates;

namespace PupBudgetPlanner.Infrastructure.Tests.ExchangeRates;

public sealed class ExchangeRateServiceTests : IDisposable
{
    private static readonly DateOnly Today = new(2026, 11, 2);
    private static readonly DateOnly Friday = new(2026, 10, 30);

    private static readonly IReadOnlyList<NbuRate> NbuToday = [new("USD", 41.35m), new("EUR", 48.1m)];

    /// <summary>The database: a few days of rates, kept as the service saves them.</summary>
    private sealed class Store : IExchangeRateStore
    {
        public Dictionary<DateOnly, Dictionary<string, decimal>> Days { get; } = [];

        public Task<IReadOnlyDictionary<string, decimal>> OnAsync(DateOnly date, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyDictionary<string, decimal>>(
                Days.TryGetValue(date, out var day) ? day : new Dictionary<string, decimal>());

        public Task<DateOnly?> LatestBeforeAsync(DateOnly date, CancellationToken cancellationToken) =>
            Task.FromResult(Days.Keys.Where(day => day < date).Select(day => (DateOnly?)day).Max());

        public Task SaveAsync(DateOnly date, IReadOnlyList<NbuRate> rates, CancellationToken cancellationToken)
        {
            Days.Add(date, rates.ToDictionary(rate => rate.Currency, rate => rate.RateToUah));
            return Task.CompletedTask;
        }
    }

    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = new(2026, 11, 2, 9, 0, 0, TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => Now;
    }

    private readonly INbuClient nbu = Substitute.For<INbuClient>();
    private readonly Store store = new();
    private readonly NbuGate gate = new();
    private readonly Clock clock = new();
    private readonly ExchangeRateService service;

    public ExchangeRateServiceTests()
    {
        service = new ExchangeRateService(nbu, store, gate, clock, NullLogger<ExchangeRateService>.Instance);
    }

    public void Dispose() => gate.Dispose();

    private void KeepFridays() => store.Days[Friday] = new() { ["USD"] = 41.2m, ["EUR"] = 47.9m };

    [Fact]
    public async Task Kept_rates_are_used_without_asking_the_nbu()
    {
        store.Days[Today] = new() { ["USD"] = 41.35m };

        var rates = await service.RatesOnAsync(Today, CancellationToken.None);

        rates.Should().BeEquivalentTo(new DayRates(Today, RatesStatus.Current, new Dictionary<string, decimal> { ["USD"] = 41.35m }));
        await nbu.DidNotReceiveWithAnyArgs().RatesOnAsync(default, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task A_missing_day_is_fetched_once_and_kept()
    {
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>()).Returns(NbuToday);

        var first = await service.RatesOnAsync(Today, CancellationToken.None);
        var second = await service.RatesOnAsync(Today, CancellationToken.None);

        first.Status.Should().Be(RatesStatus.Current);
        first.ToUah.Should().BeEquivalentTo(new Dictionary<string, decimal> { ["USD"] = 41.35m, ["EUR"] = 48.1m });
        second.Should().BeEquivalentTo(first);
        store.Days.Should().ContainKey(Today);
        await nbu.Received(1).RatesOnAsync(Today, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_day_not_published_yet_falls_back_to_the_latest_earlier_one_which_is_not_kept_under_it()
    {
        KeepFridays();
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>()).Returns([]);

        var rates = await service.RatesOnAsync(Today, CancellationToken.None);

        rates.Date.Should().Be(Friday);
        rates.Status.Should().Be(RatesStatus.NotPublished);
        rates.ToUah["USD"].Should().Be(41.2m);
        store.Days.Should().NotContainKey(Today);
    }

    [Fact]
    public async Task When_the_nbu_cant_be_reached_the_earlier_rates_are_marked_unavailable()
    {
        KeepFridays();
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>()).ThrowsAsync(new HttpRequestException("down"));

        var rates = await service.RatesOnAsync(Today, CancellationToken.None);

        rates.Date.Should().Be(Friday);
        rates.Status.Should().Be(RatesStatus.Unavailable);
        store.Days.Should().NotContainKey(Today);
    }

    [Fact]
    public async Task A_timeout_counts_as_unavailable()
    {
        KeepFridays();
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>())
            .ThrowsAsync(new TaskCanceledException("timed out", new TimeoutException()));

        (await service.RatesOnAsync(Today, CancellationToken.None)).Status.Should().Be(RatesStatus.Unavailable);
    }

    [Fact]
    public async Task A_request_the_person_left_is_cancelled_not_turned_into_a_failure()
    {
        using var left = new CancellationTokenSource();
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>()).Returns(_ =>
        {
            left.Cancel();
            return Task.FromException<IReadOnlyList<NbuRate>>(new TaskCanceledException());
        });

        await service.Invoking(s => s.RatesOnAsync(Today, left.Token)).Should().ThrowAsync<OperationCanceledException>();
        gate.FailedAt.Should().BeNull();
    }

    [Fact]
    public async Task With_nothing_earlier_kept_there_are_no_rates()
    {
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>()).ThrowsAsync(new HttpRequestException("down"));

        (await service.RatesOnAsync(Today, CancellationToken.None)).Should().Be(DayRates.Missing);
    }

    [Fact]
    public async Task After_a_failure_the_nbu_is_left_alone_for_five_minutes()
    {
        KeepFridays();
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>())
            .Returns(_ => throw new HttpRequestException("down"), _ => NbuToday);

        await service.RatesOnAsync(Today, CancellationToken.None);
        clock.Now += TimeSpan.FromMinutes(4);
        var during = await service.RatesOnAsync(Today, CancellationToken.None);
        clock.Now += TimeSpan.FromMinutes(1);
        var after = await service.RatesOnAsync(Today, CancellationToken.None);

        during.Status.Should().Be(RatesStatus.Unavailable);
        after.Status.Should().Be(RatesStatus.Current);
        after.Date.Should().Be(Today);
        await nbu.Received(2).RatesOnAsync(Today, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Two_requests_for_the_same_missing_day_at_once_make_one_call()
    {
        var release = new TaskCompletionSource<IReadOnlyList<NbuRate>>();
        nbu.RatesOnAsync(Today, Arg.Any<CancellationToken>()).Returns(_ => release.Task);

        var first = service.RatesOnAsync(Today, CancellationToken.None);
        var second = service.RatesOnAsync(Today, CancellationToken.None);
        release.SetResult(NbuToday);

        (await first).Status.Should().Be(RatesStatus.Current);
        (await second).Status.Should().Be(RatesStatus.Current);
        await nbu.Received(1).RatesOnAsync(Today, Arg.Any<CancellationToken>());
    }
}
