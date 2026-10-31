using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.ExchangeRates;

namespace PupBudgetPlanner.Application.Accounts;

/// <summary>"In total, in UAH" from the totals per currency and a day's rates (F-017). Pure, so it is tested alone.</summary>
public static class TotalInReportCurrency
{
    /// <summary>Only other currencies need rates: with none, the NBU isn't asked at all.</summary>
    public static bool NeedsRates(IReadOnlyList<CurrencyTotal> totals, string currency) =>
        currency != Currencies.Hryvnia || totals.Any(total => total.Currency != currency);

    /// <summary>
    /// The totals together in <paramref name="currency"/>, with the rates it used in hryvnias, as the NBU publishes
    /// them: the accounts' other currencies, then the report currency when it isn't the hryvnia (F-016).
    /// <paramref name="rates"/> may be null when <see cref="NeedsRates"/> said no. Without a rate for every currency
    /// there is no total (<see cref="RatesStatus.Missing"/>).
    /// </summary>
    public static AccountsTotal Of(IReadOnlyList<CurrencyTotal> totals, string currency, DayRates? rates)
    {
        if (rates is null)
        {
            return new AccountsTotal(currency, totals.Sum(total => total.Total), null, RatesStatus.Current, []);
        }

        if (Conversion.TotalIn(currency, totals, rates.ToUah) is not { } sum)
        {
            return new AccountsTotal(currency, null, null, RatesStatus.Missing, []);
        }

        var shown = totals
            .Select(total => total.Currency)
            .Append(currency)
            .Where(code => code != Currencies.Hryvnia)
            .Distinct()
            .Select(code => rates.ToUah.TryGetValue(code, out var rate) ? new RateItem(code, rate) : null)
            .OfType<RateItem>()
            .ToList();
        return new AccountsTotal(currency, sum, rates.Date, rates.Status, shown);
    }
}
