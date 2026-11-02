using PupBudgetPlanner.Application.Accounts;

namespace PupBudgetPlanner.Application.ExchangeRates;

/// <summary>
/// One day's NBU rates as the transfer form gets them (F-019): hryvnias for one unit of each currency, by code. The
/// form suggests an exchange's second amount from them. <paramref name="Date"/> is the day they belong to, earlier
/// than the asked one unless <see cref="RatesStatus.Current"/>; with <see cref="RatesStatus.Missing"/> there are none.
/// </summary>
public sealed record RatesOfDay(DateOnly? Date, RatesStatus Status, IReadOnlyList<RateItem> Rates)
{
    public static RatesOfDay Of(DayRates day) => new(
        day.Date,
        day.Status,
        day.ToUah
            .OrderBy(rate => rate.Key, StringComparer.Ordinal)
            .Select(rate => new RateItem(rate.Key, rate.Value))
            .ToList());
}
