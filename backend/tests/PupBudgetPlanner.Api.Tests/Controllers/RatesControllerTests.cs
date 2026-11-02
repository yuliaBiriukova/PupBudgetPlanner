using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class RatesControllerTests
{
    /// <summary>2 Nov 2026, 00:30 in Kyiv (22:30 UTC the day before).</summary>
    private sealed class JustAfterMidnightInKyiv : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 1, 22, 30, 0, TimeSpan.Zero);
    }

    private static readonly DateOnly Today = new(2026, 11, 2);

    private readonly IExchangeRateService rates = Substitute.For<IExchangeRateService>();
    private readonly RatesController controller;

    public RatesControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        controller = new RatesController(rates, new JustAfterMidnightInKyiv())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() },
            },
        };
    }

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(RatesController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task A_days_rates_come_by_code_with_their_date_and_why_they_are_earlier()
    {
        var earlier = new DayRates(
            new DateOnly(2026, 10, 30),
            RatesStatus.NotPublished,
            new Dictionary<string, decimal> { ["USD"] = 45.53m, ["EUR"] = 48.71m });
        rates.RatesOnAsync(Today, Arg.Any<CancellationToken>()).Returns(earlier);

        var result = await controller.OfDay(Today, CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeEquivalentTo(
            new RatesOfDay(
                new DateOnly(2026, 10, 30),
                RatesStatus.NotPublished,
                [new RateItem("EUR", 48.71m), new RateItem("USD", 45.53m)]),
            options => options.WithStrictOrdering());
    }

    [Fact]
    public async Task No_rates_at_all_say_so()
    {
        rates.RatesOnAsync(Today, Arg.Any<CancellationToken>()).Returns(DayRates.Missing);

        var result = await controller.OfDay(Today, CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeEquivalentTo(
            new RatesOfDay(null, RatesStatus.Missing, []));
    }

    [Fact]
    public async Task A_day_after_kyivs_today_is_a_bad_request_and_the_nbu_isnt_asked()
    {
        var result = (await controller.OfDay(Today.AddDays(1), CancellationToken.None)).Result;

        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("date");
        ((IStatusCodeActionResult)result!).StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        await rates.DidNotReceiveWithAnyArgs().RatesOnAsync(default, TestContext.Current.CancellationToken);
    }
}
