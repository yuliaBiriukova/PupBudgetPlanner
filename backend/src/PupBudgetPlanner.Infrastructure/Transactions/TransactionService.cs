using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Transactions;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Transactions;

internal sealed class TransactionService(AppDbContext dbContext, TimeProvider clock) : ITransactionService
{
    public async Task<LatestTransactions> LatestAsync(Guid userId, CancellationToken cancellationToken)
    {
        var items = await ItemsOf(dbContext.Transactions.Where(transaction => transaction.UserId == userId))
            .Take(LatestTransactions.Limit)
            .ToListAsync(cancellationToken);

        return new LatestTransactions(items);
    }

    public async Task<TransactionSuggestions> SuggestionsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var recent = await dbContext.Transactions.AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .OrderByDescending(transaction => transaction.CreatedAt)
            .Take(TransactionSuggestions.RecentLimit)
            .Select(transaction => new RecentTransaction(
                transaction.Type,
                transaction.AccountId,
                transaction.CategoryId,
                transaction.Date,
                transaction.CreatedAt))
            .ToListAsync(cancellationToken);

        return TransactionSuggestions.From(recent, Kyiv.Today(clock));
    }

    public async Task<SaveTransactionResult> CreateAsync(
        Guid userId, SaveTransactionRequest request, CancellationToken cancellationToken)
    {
        var outcome = await CheckAsync(userId, request, null, cancellationToken);
        if (outcome != SaveTransactionOutcome.Saved)
        {
            return new SaveTransactionResult(outcome);
        }

        var before = await BalancesAsync(userId, [request.AccountId], cancellationToken);
        var transaction = Transaction.Create(userId, DetailsOf(request), clock.GetUtcNow());
        dbContext.Transactions.Add(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await SavedAsync(userId, transaction, before, cancellationToken);
    }

    public async Task<SaveTransactionResult> UpdateAsync(
        Guid userId, Guid transactionId, SaveTransactionRequest request, CancellationToken cancellationToken)
    {
        var transaction = await FindAsync(userId, transactionId, cancellationToken);
        if (transaction is null)
        {
            return new SaveTransactionResult(SaveTransactionOutcome.NotFound);
        }

        var outcome = await CheckAsync(userId, request, transaction, cancellationToken);
        if (outcome != SaveTransactionOutcome.Saved)
        {
            return new SaveTransactionResult(outcome);
        }

        // Moved to another account: both balances change
        var before = await BalancesAsync(
            userId, [.. new[] { transaction.AccountId, request.AccountId }.Distinct()], cancellationToken);
        transaction.Update(DetailsOf(request), clock.GetUtcNow());
        await dbContext.SaveChangesAsync(cancellationToken);

        return await SavedAsync(userId, transaction, before, cancellationToken);
    }

    public async Task<DeletedTransaction?> DeleteAsync(
        Guid userId, Guid transactionId, CancellationToken cancellationToken)
    {
        var transaction = await FindAsync(userId, transactionId, cancellationToken);
        if (transaction is null)
        {
            return null;
        }

        var before = await BalancesAsync(userId, [transaction.AccountId], cancellationToken);
        dbContext.Transactions.Remove(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new DeletedTransaction(await ChangesAsync(userId, before, cancellationToken));
    }

    /// <summary>Only the person's own transactions: someone else's id is as good as a made-up one.</summary>
    private Task<Transaction?> FindAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken) =>
        dbContext.Transactions.SingleOrDefaultAsync(
            transaction => transaction.Id == transactionId && transaction.UserId == userId, cancellationToken);

    /// <summary>
    /// The account and the category must be the person's and in use, the category of the type's kind. A change may
    /// keep the archived account or category it already has.
    /// </summary>
    private async Task<SaveTransactionOutcome> CheckAsync(
        Guid userId, SaveTransactionRequest request, Transaction? current, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts.AsNoTracking().SingleOrDefaultAsync(
            account => account.Id == request.AccountId && account.UserId == userId, cancellationToken);
        if (account is null || (account.IsArchived && account.Id != current?.AccountId))
        {
            return SaveTransactionOutcome.NoSuchAccount;
        }

        var category = await (
                from item in dbContext.Categories
                join categoryGroup in dbContext.CategoryGroups on item.GroupId equals categoryGroup.Id
                where item.Id == request.CategoryId && categoryGroup.UserId == userId
                select new { item.IsArchived, categoryGroup.Kind })
            .SingleOrDefaultAsync(cancellationToken);
        if (category is null ||
            category.Kind != Transaction.CategoryKindOf(request.Type) ||
            (category.IsArchived && request.CategoryId != current?.CategoryId))
        {
            return SaveTransactionOutcome.NoSuchCategory;
        }

        return SaveTransactionOutcome.Saved;
    }

    private static TransactionDetails DetailsOf(SaveTransactionRequest request) =>
        new(request.Type, request.Date, request.AccountId, request.CategoryId, request.Amount, request.Note);

    private async Task<SaveTransactionResult> SavedAsync(
        Guid userId, Transaction transaction, Dictionary<Guid, decimal> before, CancellationToken cancellationToken)
    {
        var item = await ItemsOf(dbContext.Transactions.Where(saved => saved.Id == transaction.Id))
            .SingleAsync(cancellationToken);

        return new SaveTransactionResult(
            SaveTransactionOutcome.Saved,
            new SavedTransaction(item, await ChangesAsync(userId, before, cancellationToken)));
    }

    /// <summary>The transactions as the lists show them, the latest first: newest day, then the last added.</summary>
    private IQueryable<TransactionItem> ItemsOf(IQueryable<Transaction> transactions) =>
        from transaction in transactions.AsNoTracking()
        join account in dbContext.Accounts on transaction.AccountId equals account.Id
        join category in dbContext.Categories on transaction.CategoryId equals category.Id
        orderby transaction.Date descending, transaction.CreatedAt descending
        select new TransactionItem(
            transaction.Id,
            transaction.Type,
            transaction.Date,
            account.Id,
            account.Name,
            account.Currency,
            category.Id,
            category.Name,
            transaction.Amount,
            transaction.Note);

    /// <summary>The accounts' balances now: what <see cref="BalanceSheet"/> makes of their transactions.</summary>
    private async Task<Dictionary<Guid, decimal>> BalancesAsync(
        Guid userId, IReadOnlyCollection<Guid> accountIds, CancellationToken cancellationToken)
    {
        var accounts = await dbContext.Accounts.AsNoTracking()
            .Where(account => account.UserId == userId && accountIds.Contains(account.Id))
            .ToListAsync(cancellationToken);
        var sums = await dbContext.SumsOfAsync(userId, accountIds, cancellationToken);

        return BalanceSheet.BalancesOf(accounts, BalanceSheet.MovementsOf(sums))
            .ToDictionary(balance => balance.Account.Id, balance => balance.Balance);
    }

    private async Task<IReadOnlyList<BalanceChange>> ChangesAsync(
        Guid userId, Dictionary<Guid, decimal> before, CancellationToken cancellationToken)
    {
        var after = await BalancesAsync(userId, [.. before.Keys], cancellationToken);

        return before.Select(balance => new BalanceChange(balance.Key, balance.Value, after[balance.Key])).ToList();
    }
}
