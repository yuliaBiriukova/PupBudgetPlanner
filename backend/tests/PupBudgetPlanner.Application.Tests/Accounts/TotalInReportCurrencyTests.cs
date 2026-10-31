using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.Tests.Accounts;

public sealed class TotalInReportCurrencyTests
{
    private static readonly DateOnly Today = new(2026, 11, 2);

    private static readonly CurrencyTotal Hryvnias = new("UAH", 2, 43_899m);
    private static readonly CurrencyTotal Dollars = new("USD", 1, 1_240m);

    private static DayRates RatesOf(DateOnly day, RatesStatus status) =>
        new(day, status, new Dictionary<string, decimal> { ["USD"] = 41.35m, ["EUR"] = 48.1m });

    [Fact]
    public void Only_other_currencies_need_rates()
    {
        TotalInReportCurrency.NeedsRates([Hryvnias], "UAH").Should().BeFalse();
        TotalInReportCurrency.NeedsRates([], "UAH").Should().BeFalse();
        TotalInReportCurrency.NeedsRates([Hryvnias, Dollars], "UAH").Should().BeTrue();
        // A report currency other than the hryvnia (F-016) needs its own rate
        TotalInReportCurrency.NeedsRates([Hryvnias], "USD").Should().BeTrue();
    }

    [Fact]
    public void Hryvnias_only_are_added_up_without_rates_or_a_date()
    {
        var total = TotalInReportCurrency.Of([Hryvnias], "UAH", null);

        total.Should().Be(new AccountsTotal("UAH", 43_899m, null, RatesStatus.Current, []));
    }

    [Fact]
    public void Other_currencies_are_added_at_the_days_rates_which_are_listed_with_their_date()
    {
        var total = TotalInReportCurrency.Of([Hryvnias, Dollars], "UAH", RatesOf(Today, RatesStatus.Current));

        total.Total.Should().Be(43_899m + (1_240m * 41.35m));
        total.RatesDate.Should().Be(Today);
        total.Status.Should().Be(RatesStatus.Current);
        total.Rates.Should().Equal(new RateItem("USD", 41.35m));
    }

    [Fact]
    public void Earlier_rates_keep_their_date_and_the_reason()
    {
        var earlier = Today.AddDays(-3);

        var total = TotalInReportCurrency.Of([Hryvnias, Dollars], "UAH", RatesOf(earlier, RatesStatus.Unavailable));

        total.RatesDate.Should().Be(earlier);
        total.Status.Should().Be(RatesStatus.Unavailable);
        total.Total.Should().Be(43_899m + (1_240m * 41.35m));
    }

    [Fact]
    public void A_debt_bigger_than_the_rest_makes_the_total_negative()
    {
        var total = TotalInReportCurrency.Of(
            [new CurrencyTotal("UAH", 1, 1_000m), new CurrencyTotal("EUR", 1, -300m)], "UAH",
            RatesOf(Today, RatesStatus.Current));

        total.Total.Should().Be(1_000m - (300m * 48.1m));
    }

    [Fact]
    public void Without_rates_there_is_no_total()
    {
        var total = TotalInReportCurrency.Of([Hryvnias, Dollars], "UAH", DayRates.Missing);

        total.Should().Be(new AccountsTotal("UAH", null, null, RatesStatus.Missing, []));
    }

    [Fact]
    public void A_currency_the_nbu_gave_no_rate_for_leaves_no_total_rather_than_a_short_one()
    {
        var total = TotalInReportCurrency.Of(
            [Hryvnias, new CurrencyTotal("PLN", 1, 640m)], "UAH", RatesOf(Today, RatesStatus.Current));

        total.Total.Should().BeNull();
        total.Status.Should().Be(RatesStatus.Missing);
    }
}
