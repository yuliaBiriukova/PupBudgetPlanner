using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Infrastructure.Persistence;

/// <summary>Queries on transactions shared by the account and transaction services.</summary>
internal static class TransactionQueries
{
    /// <summary>
    /// Each account's transactions per type, counted and summed by the database, with when the latest was added: what
    /// <see cref="BalanceSheet"/> needs. Transfers count on both sides (F-019): as the From account's, and as the To
    /// account's incoming, summing what it got. All the accounts of <paramref name="people"/> (F-024), or only
    /// <paramref name="accountIds"/>.
    /// </summary>
    public static async Task<List<TransactionSum>> SumsOfAsync(
        this AppDbContext dbContext,
        IReadOnlyCollection<Guid> people,
        IReadOnlyCollection<Guid>? accountIds,
        CancellationToken cancellationToken)
    {
        var transactions = dbContext.Transactions.AsNoTracking().Where(transaction => people.Contains(transaction.UserId));

        var outgoing = await transactions
            .Where(transaction => accountIds == null || accountIds.Contains(transaction.AccountId))
            .GroupBy(transaction => new { transaction.AccountId, transaction.Type })
            .Select(group => new TransactionSum(
                group.Key.AccountId,
                group.Key.Type,
                group.Count(),
                group.Sum(transaction => transaction.Amount),
                false,
                group.Max(transaction => (DateTimeOffset?)transaction.CreatedAt)))
            .ToListAsync(cancellationToken);
        var incoming = await transactions
            .Where(transaction => transaction.ToAccountId != null)
            .Where(transaction => accountIds == null || accountIds.Contains(transaction.ToAccountId!.Value))
            .GroupBy(transaction => transaction.ToAccountId!.Value)
            .Select(group => new TransactionSum(
                group.Key,
                TransactionType.Transfer,
                group.Count(),
                group.Sum(transaction => transaction.ToAmount ?? 0),
                true,
                group.Max(transaction => (DateTimeOffset?)transaction.CreatedAt)))
            .ToListAsync(cancellationToken);

        return [.. outgoing, .. incoming];
    }

    /// <summary>
    /// The transactions that count in the totals the viewer sees (F-030): what the others keep is left out. Your own
    /// money keeps the query as it was.
    /// </summary>
    public static IQueryable<Transaction> CountedFor(this IQueryable<Transaction> transactions, KeptFromFamily kept) =>
        kept.IsNothing ? transactions : transactions.Where(kept.Counted);

    /// <summary>The transactions the viewer sees as lines (F-030): counted, and not only in the totals.</summary>
    public static IQueryable<Transaction> ListedFor(this IQueryable<Transaction> transactions, KeptFromFamily kept) =>
        kept.IsNothing ? transactions : transactions.Where(kept.Counted).Where(kept.Listed);

    /// <summary>The transactions the viewer sees only in the totals, not as lines (F-030).</summary>
    public static IQueryable<Transaction> UnlistedFor(this IQueryable<Transaction> transactions, KeptFromFamily kept) =>
        transactions.Where(kept.Counted).Where(kept.Unlisted);

    /// <summary>Whether a transaction uses the account: on it, or as a transfer's To (F-019).</summary>
    public static Task<bool> IsUsedAsync(
        this AppDbContext dbContext, Guid accountId, CancellationToken cancellationToken) =>
        dbContext.Transactions.AnyAsync(
            transaction => transaction.AccountId == accountId || transaction.ToAccountId == accountId,
            cancellationToken);
}
