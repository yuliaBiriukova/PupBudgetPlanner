namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>
/// The currencies an account can be in: the hryvnia and every currency the NBU publishes an official rate for, as
/// ISO 4217 codes (F-014). Kept in the app, so accounts don't wait for the NBU rates (F-017).
/// </summary>
public static class Currencies
{
    public const string Hryvnia = "UAH";

    /// <summary>ISO 4217 codes are three letters.</summary>
    public const int CodeLength = 3;

    /// <summary>The hryvnia first, then the NBU's list by code.</summary>
    public static readonly IReadOnlyList<string> All =
    [
        Hryvnia,
        "AUD", "AZN", "BDT", "CAD", "CHF", "CNY", "CZK", "DKK", "DZD", "EGP",
        "EUR", "GBP", "GEL", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW",
        "KZT", "LBP", "MDL", "MXN", "MYR", "NOK", "NZD", "PLN", "RON", "RSD",
        "SAR", "SEK", "SGD", "THB", "TND", "TRY", "USD", "VND", "ZAR",
    ];

    private static readonly HashSet<string> Known = new(All, StringComparer.Ordinal);

    /// <summary>Whether <paramref name="code"/> is one of <see cref="All"/>, in capitals as ISO 4217 writes it.</summary>
    public static bool IsKnown(string? code) => code is not null && Known.Contains(code);
}
