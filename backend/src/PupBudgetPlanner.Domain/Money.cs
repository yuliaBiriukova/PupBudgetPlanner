namespace PupBudgetPlanner.Domain;

/// <summary>
/// Amounts in the app are whole units of their currency, no cents (owner, 2026-10-30; ADR 0018). The columns keep
/// two decimals, so amounts worked out from rates later can be kept as they are and rounded when shown.
/// </summary>
public static class Money
{
    /// <summary>The amount rounded to a whole unit, half away from zero: 1240.50 → 1241, −4312.50 → −4313.</summary>
    public static decimal Whole(decimal amount) => decimal.Round(amount, 0, MidpointRounding.AwayFromZero);
}
