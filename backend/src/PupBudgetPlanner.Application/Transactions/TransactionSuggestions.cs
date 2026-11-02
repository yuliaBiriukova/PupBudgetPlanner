using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>The account last used for a type: the form picks it when it opens (DESIGN_RULES §5).</summary>
public sealed record LastAccount(TransactionType Type, Guid AccountId);

/// <summary>The category last used with an account for a type: the form picks it with the account (owner, F-018).</summary>
public sealed record LastCategory(TransactionType Type, Guid AccountId, Guid CategoryId);

/// <summary>A type's most used categories, most used first: the form's category pills.</summary>
public sealed record MostUsedCategories(TransactionType Type, IReadOnlyList<Guid> CategoryIds);

/// <summary>The last transfer's From and To: the form picks both when it opens on Transfer (F-019).</summary>
public sealed record LastTransfer(Guid FromAccountId, Guid ToAccountId);

/// <summary>What the suggestions are worked out from: one recent transaction (a transfer has a To, no category).</summary>
public sealed record RecentTransaction(
    TransactionType Type,
    Guid AccountId,
    Guid? CategoryId,
    DateOnly Date,
    DateTimeOffset CreatedAt,
    Guid? ToAccountId = null);

/// <summary>
/// What the quick-add form picks and offers before the person does (F-018): the last account used for each type, the
/// category last used with each account, the most used categories, and the last transfer's From and To (F-019). "Last"
/// is the last one added, whatever its day: it is the habit, and an old receipt typed in late counts as one. Pure, so
/// it is tested without a database.
/// </summary>
public sealed record TransactionSuggestions(
    IReadOnlyList<LastAccount> LastAccounts,
    IReadOnlyList<LastCategory> LastCategories,
    IReadOnlyList<MostUsedCategories> MostUsed,
    LastTransfer? LastTransfer = null)
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

        // Transfers have no category: the categories come from expenses and incomes only
        var categorised = latestFirst
            .Where(transaction => transaction.CategoryId is not null)
            .Select(transaction => (transaction.Type, transaction.AccountId, CategoryId: transaction.CategoryId!.Value,
                transaction.Date, transaction.CreatedAt))
            .ToList();
        var lastCategories = categorised
            .DistinctBy(transaction => (transaction.Type, transaction.AccountId))
            .Select(transaction => new LastCategory(transaction.Type, transaction.AccountId, transaction.CategoryId))
            .ToList();

        var since = today.AddDays(-MostUsedDays);
        var counted = categorised.Any(transaction => transaction.Date > since)
            ? categorised.Where(transaction => transaction.Date > since).ToList()
            : categorised;
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

        var lastTransfer = latestFirst
            .Where(transaction => transaction.ToAccountId is not null)
            .Select(transaction => new LastTransfer(transaction.AccountId, transaction.ToAccountId!.Value))
            .FirstOrDefault();

        return new TransactionSuggestions(lastAccounts, lastCategories, mostUsed, lastTransfer);
    }
}
