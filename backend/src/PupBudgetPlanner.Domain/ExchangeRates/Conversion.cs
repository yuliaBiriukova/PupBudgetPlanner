using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Domain.ExchangeRates;

/// <summary>
/// Converting amounts at one day's rates (F-017). Pure, so it is tested without a database. Rates are hryvnias for
/// one unit; the hryvnia itself is 1 and needs no rate. Results are kept as they are and rounded when shown
/// (ADR 0018).
/// </summary>
public static class Conversion
{
    /// <summary>Units of <paramref name="to"/> for one unit of <paramref name="from"/>; null without a rate.</summary>
    public static decimal? Rate(string from, string to, IReadOnlyDictionary<string, decimal> ratesToUah) =>
        ToUah(from, ratesToUah) is { } fromUah && ToUah(to, ratesToUah) is { } toUah && toUah != 0
            ? fromUah / toUah
            : null;

    /// <summary>
    /// The totals of every currency together in <paramref name="to"/>; null when a currency has no rate, so a total
    /// is never quietly short of an account.
    /// </summary>
    public static decimal? TotalIn(
        string to, IEnumerable<CurrencyTotal> totals, IReadOnlyDictionary<string, decimal> ratesToUah)
    {
        var sum = 0m;
        foreach (var total in totals)
        {
            if (Rate(total.Currency, to, ratesToUah) is not { } rate)
            {
                return null;
            }

            sum += total.Total * rate;
        }

        return sum;
    }

    private static decimal? ToUah(string currency, IReadOnlyDictionary<string, decimal> ratesToUah) =>
        currency == Currencies.Hryvnia ? 1m : ratesToUah.TryGetValue(currency, out var rate) ? rate : null;
}
