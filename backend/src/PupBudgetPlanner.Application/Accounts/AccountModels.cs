using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Application.Accounts;

/// <summary>
/// One account on the Accounts page. <paramref name="SourceName"/> is set for an own source and
/// <paramref name="BankName"/> for a bank; Cash and Bank themselves are named by the app.
/// <paramref name="TransactionCount"/> keeps an account with transactions from being deleted or changing its
/// currency (I-011, F-018). <paramref name="LastUsedAt"/> is when its latest transaction was added (a transfer's
/// for both its accounts), none without transactions: the quick-add form lists the account used last first (I-024).
/// <paramref name="OwnerId"/> is whose it is: someone else's only opens to look at (F-024).
/// <paramref name="FamilySees"/> is what the other members of the family see of it (F-030): your own as you set it,
/// someone else's Everything or BalanceOnly (a hidden one isn't there).
/// </summary>
public sealed record AccountItem(
    Guid Id,
    Guid OwnerId,
    string Name,
    string Currency,
    SourceKind Source,
    Guid? SourceId,
    string? SourceName,
    Guid? BankId,
    string? BankName,
    decimal OpeningBalance,
    DateOnly OpeningDate,
    decimal Balance,
    CardStyle CardStyle,
    DateTimeOffset? ArchivedAt,
    int TransactionCount,
    DateTimeOffset? LastUsedAt,
    AccountShare FamilySees);

public enum SaveAccountOutcome
{
    Saved,
    NotFound,

    /// <summary>A new currency for an account with transactions: their amounts are in its currency.</summary>
    CurrencyFixed,

    /// <summary>It would look just like another account in use (I-020).</summary>
    Copy,
}

/// <summary>What a new account or a change to one came to; <paramref name="Account"/> is set when it was saved.</summary>
public sealed record SaveAccountResult(SaveAccountOutcome Outcome, AccountItem? Account = null);

public enum RestoreAccountOutcome
{
    Restored,
    NotFound,

    /// <summary>An account in use looks just like it (I-020): one of them is renamed first.</summary>
    Copy,
}

public enum DeleteAccountOutcome
{
    Deleted,
    NotFound,

    /// <summary>Only an account without transactions can be deleted; one with them can be archived (I-011).</summary>
    HasTransactions,
}

/// <summary>A source of the person's own, besides Cash and Bank.</summary>
public sealed record SourceItem(Guid Id, string Name);

/// <summary>One of the person's banks.</summary>
public sealed record BankItem(Guid Id, string Name);

/// <summary>
/// Everything the Accounts page shows: the accounts in use (oldest first), the archived ones (last archived first),
/// the totals per currency, the person's own sources and banks (by name) for the form, and every currency an
/// account can be in.
/// </summary>
public sealed record AccountsOverview(
    IReadOnlyList<AccountItem> Accounts,
    IReadOnlyList<AccountItem> Archived,
    IReadOnlyList<CurrencyTotal> Totals,
    IReadOnlyList<SourceItem> Sources,
    IReadOnlyList<BankItem> Banks,
    IReadOnlyList<string> Currencies);

/// <summary>
/// A new account or the edited one. For <see cref="SourceKind.Own"/>, <paramref name="SourceName"/> names one of the
/// person's own sources, or a new one, which is then kept; the same for <paramref name="BankName"/> and
/// <see cref="SourceKind.Bank"/>. Names match ignoring case.
/// </summary>
public sealed record SaveAccountRequest(
    string Name,
    string Currency,
    SourceKind Source,
    string? SourceName,
    string? BankName,
    decimal OpeningBalance,
    DateOnly OpeningDate,
    CardStyle CardStyle);

/// <summary>
/// One currency's NBU rate: hryvnias for one unit of <paramref name="Currency"/>, as the NBU publishes it (F-016;
/// F-017 gave it in the report currency, which was the hryvnia then).
/// </summary>
public sealed record RateItem(string Currency, decimal Rate);

/// <summary>
/// "In total, in UAH" on the Accounts page (F-017): every account in use together in <paramref name="Currency"/> (the
/// person's report currency, F-016) at the NBU rates of <paramref name="RatesDate"/>, with the rates it used: the
/// person's other currencies and the report currency's own when it isn't the hryvnia.
/// <paramref name="Total"/> is empty when there are no rates for it (<see cref="RatesStatus.Missing"/>). With
/// accounts in the report currency only, no rates are needed: no date and no rates.
/// </summary>
public sealed record AccountsTotal(
    string Currency,
    decimal? Total,
    DateOnly? RatesDate,
    RatesStatus Status,
    IReadOnlyList<RateItem> Rates);
