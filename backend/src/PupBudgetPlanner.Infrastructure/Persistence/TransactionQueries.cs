using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Infrastructure.Persistence;

/// <summary>Queries on transactions shared by the account and transaction services.</summary>
internal static class TransactionQueries
{
    /// <summary>
    /// Each account's transactions per type, counted and summed by the database: what <see cref="BalanceSheet"/>
    /// needs. Transfers count on both sides (F-019): as the From account's, and as the To account's incoming, summing
    /// what it got. All the person's accounts, or only <paramref name="accountIds"/>.
    /// </summary>
    public static async Task<List<TransactionSum>> SumsOfAsync(
        this AppDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid>? accountIds,
        CancellationToken cancellationToken)
    {
        var transactions = dbContext.Transactions.AsNoTracking().Where(transaction => transaction.UserId == userId);

        var outgoing = await transactions
            .Where(transaction => accountIds == null || accountIds.Contains(transaction.AccountId))
            .GroupBy(transaction => new { transaction.AccountId, transaction.Type })
            .Select(group => new TransactionSum(
                group.Key.AccountId,
                group.Key.Type,
                group.Count(),
                group.Sum(transaction => transaction.Amount),
                false))
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
                true))
            .ToListAsync(cancellationToken);

        return [.. outgoing, .. incoming];
    }

    /// <summary>Whether a transaction uses the account: on it, or as a transfer's To (F-019).</summary>
    public static Task<bool> IsUsedAsync(
        this AppDbContext dbContext, Guid accountId, CancellationToken cancellationToken) =>
        dbContext.Transactions.AnyAsync(
            transaction => transaction.AccountId == accountId || transaction.ToAccountId == accountId,
            cancellationToken);
}
