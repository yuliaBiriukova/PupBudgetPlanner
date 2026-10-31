namespace PupBudgetPlanner.Application.ExchangeRates;

/// <summary>Whether the rates are the asked day's, and if not, why.</summary>
public enum RatesStatus
{
    /// <summary>The asked day's own rates.</summary>
    Current,

    /// <summary>The NBU hasn't published the day's rates yet: the latest earlier ones.</summary>
    NotPublished,

    /// <summary>The NBU can't be reached: the latest earlier ones.</summary>
    Unavailable,

    /// <summary>No rates at all: the NBU can't give them and nothing earlier is kept.</summary>
    Missing,
}

/// <summary>
/// One day's rates as they are used: hryvnias for one unit of each currency (the hryvnia itself isn't listed).
/// <paramref name="Date"/> is the day they belong to, earlier than the asked one unless <see cref="RatesStatus.Current"/>;
/// empty for <see cref="RatesStatus.Missing"/>.
/// </summary>
public sealed record DayRates(DateOnly? Date, RatesStatus Status, IReadOnlyDictionary<string, decimal> ToUah)
{
    public static DayRates Missing { get; } = new(null, RatesStatus.Missing, new Dictionary<string, decimal>());
}

/// <summary>The NBU's official rates (F-017), fetched on demand and kept in the database. Implemented in Infrastructure.</summary>
public interface IExchangeRateService
{
    /// <summary>
    /// The rates of <paramref name="day"/>: from the database, else from the NBU (then kept), else the latest earlier
    /// ones kept, marked with the reason.
    /// </summary>
    Task<DayRates> RatesOnAsync(DateOnly day, CancellationToken cancellationToken);
}
