using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Reports;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class ReportsControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();

    private static readonly ReportLine Line = new([0m], 0m, null);
    private static readonly Report Report = new(
        "UAH",
        [new ReportMonth(new DateOnly(2026, 10, 1), ReportMonthState.Passed, false, null)],
        null,
        [],
        new ReportSummary(Line, Line, Line, Line, Line, 0m));

    /// <summary>4 Nov 2026 in Kyiv.</summary>
    private sealed class November4 : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 4, 9, 0, 0, TimeSpan.Zero);
    }

    private readonly IReportService reports = Substitute.For<IReportService>();
    private readonly ReportsController controller;

    public ReportsControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var person = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        var clock = new November4();
        controller = new ReportsController(
            reports, new YearReportQueryValidator(clock), new MonthReportQueryValidator(clock))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider(), User = person },
            },
        };
    }

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(ReportsController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task The_yearly_report_is_the_signed_in_persons_january_to_december()
    {
        reports.ReportAsync(UserId, ReportPeriod.Year(2026), "USD", Arg.Any<CancellationToken>()).Returns(Report);

        (await controller.Year(2026, CancellationToken.None, "USD")).Result
            .Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(Report);
    }

    [Fact]
    public async Task The_monthly_report_is_the_signed_in_persons_one_month_in_the_report_currency_by_default()
    {
        reports.ReportAsync(UserId, ReportPeriod.Month(2026, 10), null, Arg.Any<CancellationToken>()).Returns(Report);

        (await controller.Month("2026-10", CancellationToken.None)).Result
            .Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(Report);
    }

    [Fact]
    public async Task A_year_or_month_still_to_come_or_an_unknown_currency_is_a_bad_request()
    {
        var year = (await controller.Year(2027, CancellationToken.None)).Result;
        var month = (await controller.Month("2026-12", CancellationToken.None)).Result;
        var unwritten = (await controller.Month(null, CancellationToken.None)).Result;
        var currency = (await controller.Year(2026, CancellationToken.None, "XYZ")).Result;

        year.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("year");
        month.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("month");
        unwritten.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("month");
        currency.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("currency");
        await reports.DidNotReceiveWithAnyArgs()
            .ReportAsync(default, default!, default, TestContext.Current.CancellationToken);
    }
}
