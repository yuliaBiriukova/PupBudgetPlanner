using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>
/// What an account is, as the form sets it: everything but who owns it and whether it is archived. The source id is
/// set for <see cref="SourceKind.Own"/> only, the bank id for <see cref="SourceKind.Bank"/> only.
/// </summary>
public sealed record AccountDetails(
    string Name,
    string Currency,
    SourceKind Source,
    Guid? SourceId,
    Guid? BankId,
    decimal OpeningBalance,
    DateOnly OpeningDate,
    CardStyle CardStyle);

/// <summary>
/// A bank account, a card, cash or anything else that holds money in one currency (F-014). Its balance is the
/// opening balance plus its transactions (<see cref="BalanceSheet"/>). Archived accounts leave the totals and the
/// pickers but keep their history.
/// </summary>
public sealed class Account
{
    public const int NameMaxLength = 40;

    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public string Name { get; private set; } = string.Empty;

    /// <summary>ISO 4217 code, one of <see cref="Currencies.All"/>.</summary>
    public string Currency { get; private set; } = Currencies.Hryvnia;

    public SourceKind Source { get; private set; }

    /// <summary>Set for <see cref="SourceKind.Own"/>, empty otherwise.</summary>
    public Guid? SourceId { get; private set; }

    /// <summary>Set for <see cref="SourceKind.Bank"/>, empty otherwise.</summary>
    public Guid? BankId { get; private set; }

    /// <summary>
    /// What was on it on <see cref="OpeningDate"/>, in whole units (<see cref="Money"/>); below zero for a credit
    /// card debt.
    /// </summary>
    public decimal OpeningBalance { get; private set; }

    public DateOnly OpeningDate { get; private set; }

    public CardStyle CardStyle { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When it was archived; empty while it is in use.</summary>
    public DateTimeOffset? ArchivedAt { get; private set; }

    public bool IsArchived => ArchivedAt is not null;

    /// <summary>What the other members of the family see of it (F-030); set on the Family page, not in the form.</summary>
    public AccountShare FamilySees { get; private set; }

    /// <summary>Sets what the family sees of it; nothing else changes, and nothing is deleted or moved.</summary>
    public void ShareWithFamily(AccountShare share)
    {
        if (!Enum.IsDefined(share))
        {
            throw new ArgumentOutOfRangeException(nameof(share), share, "No such share.");
        }

        FamilySees = share;
    }

    public static Account Create(Guid userId, AccountDetails details, DateTimeOffset now)
    {
        var account = new Account { Id = Guid.CreateVersion7(now), UserId = userId, CreatedAt = now };
        account.Update(details);
        return account;
    }

    /// <summary>
    /// Takes the form's values, the opening balance rounded to a whole unit. The source's own source or bank must
    /// match its kind.
    /// </summary>
    public void Update(AccountDetails details)
    {
        if ((details.Source == SourceKind.Own) != details.SourceId.HasValue ||
            (details.Source == SourceKind.Bank) != details.BankId.HasValue)
        {
            throw new ArgumentException(
                "An own source needs its source, a bank its bank, and nothing else.", nameof(details));
        }

        if (!Currencies.IsKnown(details.Currency))
        {
            throw new ArgumentException($"Unknown currency '{details.Currency}'.", nameof(details));
        }

        Name = details.Name.Trim();
        Currency = details.Currency;
        Source = details.Source;
        SourceId = details.SourceId;
        BankId = details.BankId;
        OpeningBalance = Money.Whole(details.OpeningBalance);
        OpeningDate = details.OpeningDate;
        CardStyle = details.CardStyle;
    }

    /// <summary>Hides it from the totals and the pickers. Archiving an archived account changes nothing.</summary>
    public void Archive(DateTimeOffset now) => ArchivedAt ??= now;

    public void Restore() => ArchivedAt = null;

    /// <summary>
    /// Whether an account with <paramref name="details"/> would look just like this one in the pickers and the list
    /// (I-020): the same name, ignoring case and the spaces around it, currency, source and own source or bank.
    /// </summary>
    public bool LooksLike(AccountDetails details) =>
        string.Equals(Name, details.Name.Trim(), StringComparison.OrdinalIgnoreCase) &&
        Currency == details.Currency &&
        Source == details.Source &&
        SourceId == details.SourceId &&
        BankId == details.BankId;

    /// <summary>
    /// The account in use among <paramref name="accounts"/> that <paramref name="details"/> would copy, leaving out
    /// <paramref name="except"/> (the account being changed or restored); archived ones don't count (I-020).
    /// </summary>
    public static Account? CopyIn(IEnumerable<Account> accounts, AccountDetails details, Guid? except = null) =>
        accounts.FirstOrDefault(account => !account.IsArchived && account.Id != except && account.LooksLike(details));

    /// <summary>What the form would show for it: its details as they are saved.</summary>
    public AccountDetails Details =>
        new(Name, Currency, Source, SourceId, BankId, OpeningBalance, OpeningDate, CardStyle);
}
