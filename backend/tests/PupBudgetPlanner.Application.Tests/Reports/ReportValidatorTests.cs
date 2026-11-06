using PupBudgetPlanner.Application.Reports;

namespace PupBudgetPlanner.Application.Tests.Reports;

public sealed class ReportValidatorTests
{
    /// <summary>1 Nov 2026, 00:30 in Kyiv (22:30 UTC the day before): November is already this month.</summary>
    private sealed class JustAfterMidnightInKyiv : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 10, 31, 22, 30, 0, TimeSpan.Zero);
    }

    private static readonly YearReportQueryValidator Year = new(new JustAfterMidnightInKyiv());
    private static readonly MonthReportQueryValidator Month = new(new JustAfterMidnightInKyiv());

    [Theory]
    [InlineData(2000)]
    [InlineData(2026)]
    public void A_year_from_2000_to_this_one_is_fine(int year)
    {
        Year.Validate(new YearReportQuery(year)).IsValid.Should().BeTrue();
        Year.Validate(new YearReportQuery(year, "USD")).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(2027)]
    public void A_year_before_2000_or_still_to_come_is_not(int year)
    {
        Year.Validate(new YearReportQuery(year)).Errors.Should().ContainSingle()
            .Which.ErrorMessage.Should().Be("Pick a year from 2000 to this one.");
    }

    [Theory]
    [InlineData("2000-01")]
    [InlineData("2026-10")]
    [InlineData("2026-11")]
    public void A_month_written_yyyy_mm_from_2000_to_this_one_is_fine(string month)
    {
        Month.Validate(new MonthReportQuery(month)).IsValid.Should().BeTrue();
        new MonthReportQuery(month).First.Should().NotBeNull();
    }

    [Theory]
    [InlineData(null, "Write the month as yyyy-MM, e.g. 2026-10.")]
    [InlineData("2026-13", "Write the month as yyyy-MM, e.g. 2026-10.")]
    [InlineData("10.2026", "Write the month as yyyy-MM, e.g. 2026-10.")]
    [InlineData("1999-12", "Pick a month from 2000 to this one.")]
    [InlineData("2026-12", "Pick a month from 2000 to this one.")]
    public void Another_month_is_not(string? month, string message)
    {
        Month.Validate(new MonthReportQuery(month)).Errors.Should().ContainSingle()
            .Which.ErrorMessage.Should().Be(message);
    }

    [Fact]
    public void A_currency_must_be_one_from_the_list()
    {
        Year.Validate(new YearReportQuery(2026, "XYZ")).Errors.Should().ContainSingle()
            .Which.PropertyName.Should().Be(nameof(YearReportQuery.Currency));
        Month.Validate(new MonthReportQuery("2026-10", "usd")).Errors.Should().ContainSingle()
            .Which.PropertyName.Should().Be(nameof(MonthReportQuery.Currency));
    }
}
