using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>The account last used for a type: the form picks it when it opens (DESIGN_RULES §5).</summary>
public sealed record LastAccount(TransactionType Type, Guid AccountId);

/// <summary>The category last used with an account for a type: the form picks it with the account (owner, F-018).</summary>
public sealed record LastCategory(TransactionType Type, Guid AccountId, Guid CategoryId);

/// <summary>A type's most used categories, most used first: the form's category pills.</summary>
public sealed record MostUsedCategories(TransactionType Type, IReadOnlyList<Guid> CategoryIds);

/// <summary>What the suggestions are worked out from: one recent transaction.</summary>
public sealed record RecentTransaction(
    TransactionType Type,
    Guid AccountId,
    Guid CategoryId,
    DateOnly Date,
    DateTimeOffset CreatedAt);

/// <summary>
/// What the quick-add form picks and offers before the person does (F-018): the last account used for each type, the
/// category last used with each account, and the most used categories. "Last" is the last one added, whatever its day:
/// it is the habit, and an old receipt typed in late counts as one. Pure, so it is tested without a database.
/// </summary>
public sealed record TransactionSuggestions(
    IReadOnlyList<LastAccount> LastAccounts,
    IReadOnlyList<LastCategory> LastCategories,
    IReadOnlyList<MostUsedCategories> MostUsed)
{
    /// <summary>How many of the latest added transactions the suggestions look at.</summary>
    public const int RecentLimit = 1000;

    /// <summary>The most used are counted over this many days, or over all the recent ones when none are that new.</summary>
    public const int MostUsedDays = 90;

    /// <summary>The most pills the form shows (8 on the desktop, 6 on the phone).</summary>
    public const int MostUsedCount = 8;

    public static TransactionSuggestions From(IEnumerable<RecentTransaction> recent, DateOnly today)
    {
        var latestFirst = recent.OrderByDescending(transaction => transaction.CreatedAt).ToList();

        var lastAccounts = latestFirst
            .DistinctBy(transaction => transaction.Type)
            .Select(transaction => new LastAccount(transaction.Type, transaction.AccountId))
            .OrderBy(last => last.Type)
            .ToList();
        var lastCategories = latestFirst
            .DistinctBy(transaction => (transaction.Type, transaction.AccountId))
            .Select(transaction => new LastCategory(transaction.Type, transaction.AccountId, transaction.CategoryId))
            .ToList();

        var since = today.AddDays(-MostUsedDays);
        var counted = latestFirst.Any(transaction => transaction.Date > since)
            ? latestFirst.Where(transaction => transaction.Date > since).ToList()
            : latestFirst;
        // Most used first; between two used as often, the one used last
        var mostUsed = counted
            .GroupBy(transaction => transaction.Type)
            .OrderBy(group => group.Key)
            .Select(group => new MostUsedCategories(
                group.Key,
                group
                    .GroupBy(transaction => transaction.CategoryId)
                    .OrderByDescending(category => category.Count())
                    .ThenByDescending(category => category.Max(transaction => transaction.CreatedAt))
                    .Select(category => category.Key)
                    .Take(MostUsedCount)
                    .ToList()))
            .ToList();

        return new TransactionSuggestions(lastAccounts, lastCategories, mostUsed);
    }
}
