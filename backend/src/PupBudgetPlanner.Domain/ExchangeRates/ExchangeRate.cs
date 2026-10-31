namespace PupBudgetPlanner.Domain.ExchangeRates;

/// <summary>Where a rate came from; leaves room for other sources.</summary>
public enum RateSource
{
    Nbu,
}

/// <summary>
/// The official rate of one currency on one day: hryvnias for one unit (F-017). Only rates the source gave for that
/// very day are kept; a fallback to an earlier day is never stored under a later date.
/// </summary>
public sealed class ExchangeRate
{
    /// <summary>The NBU gives up to six decimals (<c>numeric(18,6)</c>).</summary>
    public const int Decimals = 6;

    public DateOnly Date { get; init; }

    /// <summary>ISO 4217 code, one of <see cref="Accounts.Currencies.All"/> but the hryvnia.</summary>
    public required string Currency { get; init; }

    public decimal RateToUah { get; init; }

    public RateSource Source { get; init; }
}
