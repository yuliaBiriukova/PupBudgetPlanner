using System.Text.Json;
using Microsoft.Extensions.Logging;
using PupBudgetPlanner.Application.ExchangeRates;

namespace PupBudgetPlanner.Infrastructure.ExchangeRates;

/// <summary>
/// Shared by every request (a singleton): one call to the NBU at a time, so two requests for the same missing day
/// make one call, and a pause after a failed call, so a dead NBU doesn't slow every page.
/// </summary>
internal sealed class NbuGate : IDisposable
{
    public static readonly TimeSpan PauseAfterFailure = TimeSpan.FromMinutes(5);

    public SemaphoreSlim OneCall { get; } = new(1, 1);

    public DateTimeOffset? FailedAt { get; set; }

    public void Dispose() => OneCall.Dispose();
}

internal sealed partial class ExchangeRateService(
    INbuClient nbu,
    IExchangeRateStore store,
    NbuGate gate,
    TimeProvider clock,
    ILogger<ExchangeRateService> logger) : IExchangeRateService
{
    public async Task<DayRates> RatesOnAsync(DateOnly day, CancellationToken cancellationToken)
    {
        var kept = await store.OnAsync(day, cancellationToken);
        if (kept.Count > 0)
        {
            return new DayRates(day, RatesStatus.Current, kept);
        }

        var status = await FetchAsync(day, cancellationToken);
        if (status == RatesStatus.Current)
        {
            return new DayRates(day, RatesStatus.Current, await store.OnAsync(day, cancellationToken));
        }

        return await store.LatestBeforeAsync(day, cancellationToken) is { } earlier
            ? new DayRates(earlier, status, await store.OnAsync(earlier, cancellationToken))
            : DayRates.Missing;
    }

    /// <summary>
    /// Asks the NBU for the day and keeps what it gives: <see cref="RatesStatus.Current"/> when the day's rates are now
    /// kept, else why not.
    /// </summary>
    private async Task<RatesStatus> FetchAsync(DateOnly day, CancellationToken cancellationToken)
    {
        await gate.OneCall.WaitAsync(cancellationToken);
        try
        {
            // Another request may have kept them while this one waited
            if ((await store.OnAsync(day, cancellationToken)).Count > 0)
            {
                return RatesStatus.Current;
            }

            if (gate.FailedAt is { } failedAt && clock.GetUtcNow() - failedAt < NbuGate.PauseAfterFailure)
            {
                return RatesStatus.Unavailable;
            }

            var rates = await nbu.RatesOnAsync(day, cancellationToken);
            gate.FailedAt = null;
            if (rates.Count == 0)
            {
                return RatesStatus.NotPublished;
            }

            await store.SaveAsync(day, rates, cancellationToken);
            return RatesStatus.Current;
        }
        catch (Exception exception) when (
            exception is HttpRequestException or JsonException
            || (exception is TaskCanceledException && !cancellationToken.IsCancellationRequested))
        {
            // A timeout is a TaskCanceledException too, but not one the caller asked for
            gate.FailedAt = clock.GetUtcNow();
            LogNbuFailed(logger, day, exception);
            return RatesStatus.Unavailable;
        }
        finally
        {
            gate.OneCall.Release();
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Couldn't get the NBU rates of {Day}; earlier ones are used")]
    private static partial void LogNbuFailed(ILogger logger, DateOnly day, Exception exception);
}
