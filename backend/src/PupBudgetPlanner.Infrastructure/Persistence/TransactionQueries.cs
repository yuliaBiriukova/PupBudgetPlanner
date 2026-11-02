using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Infrastructure.Persistence;

/// <summary>Queries on transactions shared by the account and transaction services.</summary>
internal static class TransactionQueries
{
    /// <summary>
    /// Each account's transactions per type, counted and summed by the database: what <see cref="BalanceSheet"/>
    /// needs. All the person's accounts, or only <paramref name="accountIds"/>.
    /// </summary>
    public static Task<List<TransactionSum>> SumsOfAsync(
        this AppDbContext dbContext,
        Guid userId,
        IReadOnlyCollection<Guid>? accountIds,
        CancellationToken cancellationToken) =>
        dbContext.Transactions.AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .Where(transaction => accountIds == null || accountIds.Contains(transaction.AccountId))
            .GroupBy(transaction => new { transaction.AccountId, transaction.Type })
            .Select(group => new TransactionSum(
                group.Key.AccountId,
                group.Key.Type,
                group.Count(),
                group.Sum(transaction => transaction.Amount)))
            .ToListAsync(cancellationToken);
}
