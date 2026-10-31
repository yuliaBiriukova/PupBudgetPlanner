using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.ExchangeRates;

namespace PupBudgetPlanner.Domain.Tests.ExchangeRates;

public sealed class ConversionTests
{
    private static readonly Dictionary<string, decimal> Rates = new() { ["USD"] = 41.35m, ["EUR"] = 48.1m };

    [Fact]
    public void A_rate_to_the_hryvnia_is_the_nbu_rate_and_the_hryvnia_itself_is_one()
    {
        Conversion.Rate("USD", "UAH", Rates).Should().Be(41.35m);
        Conversion.Rate("UAH", "UAH", Rates).Should().Be(1m);
    }

    [Fact]
    public void A_rate_between_two_other_currencies_goes_through_the_hryvnia()
    {
        Conversion.Rate("EUR", "USD", Rates).Should().BeApproximately(48.1m / 41.35m, 0.000001m);
        Conversion.Rate("UAH", "USD", Rates).Should().BeApproximately(1m / 41.35m, 0.000001m);
    }

    [Fact]
    public void A_currency_without_a_rate_has_none()
    {
        Conversion.Rate("PLN", "UAH", Rates).Should().BeNull();
        Conversion.Rate("UAH", "PLN", Rates).Should().BeNull();
    }

    [Fact]
    public void The_total_adds_every_currency_at_its_rate_and_a_debt_counts_against_it()
    {
        var totals = new[]
        {
            new CurrencyTotal("UAH", 2, 43_899m),
            new CurrencyTotal("USD", 1, 1_240m),
            new CurrencyTotal("EUR", 1, -300m),
        };

        Conversion.TotalIn("UAH", totals, Rates).Should().Be(43_899m + (1_240m * 41.35m) - (300m * 48.1m));
    }

    [Fact]
    public void Without_a_rate_for_one_currency_there_is_no_total()
    {
        var totals = new[] { new CurrencyTotal("UAH", 1, 100m), new CurrencyTotal("PLN", 1, 640m) };

        Conversion.TotalIn("UAH", totals, Rates).Should().BeNull();
    }

    [Fact]
    public void No_accounts_make_a_total_of_zero()
    {
        Conversion.TotalIn("UAH", [], Rates).Should().Be(0m);
    }
}
