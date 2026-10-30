namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>
/// How an account's card looks on the Accounts page (F-014). Named by the look, so the names fit both themes: Solid
/// is charcoal in light mode and light grey in dark mode.
/// </summary>
public enum CardStyle
{
    Solid,
    Tinted,
    Envelope,
    Plain,
}

public static class CardStyles
{
    /// <summary>A new account's style until the person picks one: a bank card is solid, cash an envelope.</summary>
    public static CardStyle DefaultFor(SourceKind source) => source switch
    {
        SourceKind.Bank => CardStyle.Solid,
        SourceKind.Cash => CardStyle.Envelope,
        _ => CardStyle.Plain,
    };
}
