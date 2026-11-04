namespace PupBudgetPlanner.Application.ExchangeRates;

/// <summary>
/// The NBU's rates are set per day in Kyiv, and the people using the app live there: "today" is Kyiv's date, not the
/// server's (UTC on Render).
/// </summary>
public static class Kyiv
{
    /// <summary>The IANA name, and the name older time zone data still uses.</summary>
    private static readonly TimeZoneInfo Zone =
        TimeZoneInfo.TryFindSystemTimeZoneById("Europe/Kyiv", out var zone) ? zone
        : TimeZoneInfo.FindSystemTimeZoneById("Europe/Kiev");

    public static DateOnly Today(TimeProvider clock) => DateOf(clock.GetUtcNow());

    /// <summary>The day it was in Kyiv at <paramref name="moment"/>.</summary>
    public static DateOnly DateOf(DateTimeOffset moment) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(moment, Zone).DateTime);
}
