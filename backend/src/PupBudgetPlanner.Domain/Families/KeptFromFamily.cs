using System.Linq.Expressions;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Domain.Families;

/// <summary>One person's account that the family doesn't see all of (F-030).</summary>
public sealed record KeptAccount(Guid Id, Guid OwnerId, AccountShare Share);

/// <summary>
/// One person's category kept private (F-030): itself, or as part of a private group. Every category of a private group
/// is given too: their transactions are left out by the category.
/// </summary>
public sealed record KeptCategory(Guid Id, Guid OwnerId);

/// <summary>One person's category group kept private as a whole (F-030).</summary>
public sealed record KeptGroup(Guid Id, Guid OwnerId);

/// <summary>
/// What one person (the viewer) may not see of the other members' money, from their settings (F-030). Each person sees
/// all of their own; of someone else's:
/// <list type="bullet">
/// <item>a <see cref="AccountShare.Hidden"/> account is gone, with its balance and its transactions;</item>
/// <item>a transaction in a private category is gone, from the totals too;</item>
/// <item>a transaction on a <see cref="AccountShare.BalanceOnly"/> account, or of someone who shares
/// <see cref="TransactionShare.Totals"/>, counts in the totals by category but isn't listed;</item>
/// <item>a transfer between a hidden account and one that is shown stays on the shown side, the hidden one unnamed;</item>
/// <item>when the settings collide, the stricter wins.</item>
/// </list>
/// The rules are expressions, so the database leaves out what is kept and it never reaches the viewer.
/// </summary>
public sealed class KeptFromFamily
{
    private readonly IReadOnlyCollection<Guid> balanceOnlyAccounts;
    private readonly IReadOnlyCollection<Guid> totalsOnly;
    private readonly IReadOnlyCollection<Guid> privateGroups;

    private KeptFromFamily(
        IReadOnlyCollection<Guid> hiddenAccounts,
        IReadOnlyCollection<Guid> balanceOnlyAccounts,
        IReadOnlyCollection<Guid> privateCategories,
        IReadOnlyCollection<Guid> totalsOnly,
        IReadOnlyCollection<Guid> privateGroups)
    {
        HiddenAccounts = hiddenAccounts;
        this.privateGroups = privateGroups;
        this.balanceOnlyAccounts = balanceOnlyAccounts;
        PrivateCategories = privateCategories;
        this.totalsOnly = totalsOnly;

        // Collections, not arrays, so EF Core reads Contains as SQL's IN (as the services' other queries do)
        var hidden = hiddenAccounts;
        var categories = privateCategories;
        var balanceOnly = balanceOnlyAccounts;
        var totals = totalsOnly;

        Counted = transaction =>
            !(transaction.CategoryId != null && categories.Contains(transaction.CategoryId.Value)) &&
            (transaction.Type == TransactionType.Transfer
                ? !(hidden.Contains(transaction.AccountId) &&
                    transaction.ToAccountId != null && hidden.Contains(transaction.ToAccountId.Value))
                : !hidden.Contains(transaction.AccountId));

        Unlisted = transaction =>
            totals.Contains(transaction.UserId) ||
            balanceOnly.Contains(transaction.AccountId) ||
            (transaction.ToAccountId != null && balanceOnly.Contains(transaction.ToAccountId.Value));

        Listed = transaction =>
            !(totals.Contains(transaction.UserId) ||
              balanceOnly.Contains(transaction.AccountId) ||
              (transaction.ToAccountId != null && balanceOnly.Contains(transaction.ToAccountId.Value)));
    }

    /// <summary>Nobody keeps anything: your own money, or a family where everything is shared.</summary>
    public static KeptFromFamily Nothing { get; } = new([], [], [], [], []);

    /// <summary>
    /// What <paramref name="viewerId"/> may not see, from the settings of the people whose money it is: their accounts
    /// not shared in full, their private categories (those of a private group too), who shares only totals, and their
    /// private groups. The viewer's own never count.
    /// </summary>
    public static KeptFromFamily For(
        Guid viewerId,
        IEnumerable<KeptAccount> accounts,
        IEnumerable<KeptCategory> privateCategories,
        IEnumerable<Guid> sharingTotalsOnly,
        IEnumerable<KeptGroup>? privateGroups = null)
    {
        var others = accounts.Where(account => account.OwnerId != viewerId).ToList();
        return new KeptFromFamily(
            others.Where(account => account.Share == AccountShare.Hidden).Select(account => account.Id).ToList(),
            others.Where(account => account.Share == AccountShare.BalanceOnly).Select(account => account.Id).ToList(),
            privateCategories.Where(category => category.OwnerId != viewerId).Select(category => category.Id).ToList(),
            sharingTotalsOnly.Where(person => person != viewerId).Distinct().ToList(),
            (privateGroups ?? []).Where(group => group.OwnerId != viewerId).Select(group => group.Id).ToList());
    }

    /// <summary>Whether anything is kept from the viewer.</summary>
    public bool IsNothing =>
        HiddenAccounts.Count == 0 && balanceOnlyAccounts.Count == 0 && PrivateCategories.Count == 0 &&
        totalsOnly.Count == 0 && privateGroups.Count == 0;

    /// <summary>The others' accounts the viewer doesn't see at all.</summary>
    public IReadOnlyCollection<Guid> HiddenAccounts { get; }

    /// <summary>The others' categories the viewer sees nothing of.</summary>
    public IReadOnlyCollection<Guid> PrivateCategories { get; }

    /// <summary>
    /// A transaction that counts in the viewer's totals (by category, the day's, the reports'): not in a private
    /// category, not on a hidden account; a transfer unless both its accounts are hidden.
    /// </summary>
    public Expression<Func<Transaction, bool>> Counted { get; }

    /// <summary>
    /// A transaction counted but not listed: its owner shares only totals, or it is on (or a transfer with) an account
    /// whose balance only is shared.
    /// </summary>
    public Expression<Func<Transaction, bool>> Unlisted { get; }

    /// <summary>
    /// The opposite of <see cref="Unlisted"/>: with <see cref="Counted"/>, the lines the viewer sees. A transfer with a
    /// hidden account is one of them when its other account is shared in full: the hidden side goes unnamed.
    /// </summary>
    public Expression<Func<Transaction, bool>> Listed { get; }

    /// <summary>Whether the viewer sees the account (and its balance).</summary>
    public bool Shows(Guid accountId) => !HiddenAccounts.Contains(accountId);

    /// <summary>Whether the account's transactions are left off the viewer's lists, its balance shown.</summary>
    public bool ShowsBalanceOnly(Guid accountId) => balanceOnlyAccounts.Contains(accountId);

    /// <summary>Whether <paramref name="personId"/> shares only the totals of their transactions with the viewer.</summary>
    public bool SharesTotalsOnly(Guid personId) => totalsOnly.Contains(personId);

    /// <summary>Whether the viewer sees the category (and its transactions and its total).</summary>
    public bool ShowsCategory(Guid categoryId) => !PrivateCategories.Contains(categoryId);

    /// <summary>
    /// The groups as the viewer sees them: without the others' private groups and private categories, and without a
    /// group of someone else's that had categories and has none left. Copies: the groups given are left as they are.
    /// </summary>
    public IReadOnlyList<CategoryGroup> Shown(IEnumerable<CategoryGroup> groups)
    {
        var shown = new List<CategoryGroup>();
        foreach (var group in groups.Where(group => !privateGroups.Contains(group.Id)))
        {
            var categories = group.Categories.Where(category => ShowsCategory(category.Id)).ToList();
            if (categories.Count == 0 && group.Categories.Count > 0)
            {
                continue;
            }

            var copy = new CategoryGroup
            {
                Id = group.Id,
                UserId = group.UserId,
                Name = group.Name,
                Kind = group.Kind,
                SortOrder = group.SortOrder,
                IsArchived = group.IsArchived,
            };
            foreach (var category in categories)
            {
                copy.Categories.Add(category);
            }

            shown.Add(copy);
        }

        return shown;
    }
}
