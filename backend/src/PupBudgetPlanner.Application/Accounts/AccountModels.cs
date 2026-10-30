using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.Accounts;

/// <summary>
/// One account on the Accounts page. <paramref name="SourceName"/> is set for an own source and
/// <paramref name="BankName"/> for a bank; Cash and Bank themselves are named by the app.
/// </summary>
public sealed record AccountItem(
    Guid Id,
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
    DateTimeOffset? ArchivedAt);

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
