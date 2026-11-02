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
                transaction.CreatedAt,
                transaction.ToAccountId))
            .ToListAsync(cancellationToken);

        return TransactionSuggestions.From(recent, Kyiv.Today(clock));
    }

    public async Task<SaveTransactionResult> CreateAsync(
        Guid userId, SaveTransactionRequest request, CancellationToken cancellationToken)
    {
        var (outcome, details) = await CheckAsync(userId, request, null, cancellationToken);
        if (details is null)
        {
            return new SaveTransactionResult(outcome);
        }

        var before = await BalancesAsync(userId, AccountsOf(details), cancellationToken);
        var transaction = Transaction.Create(userId, details, clock.GetUtcNow());
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

        var (outcome, details) = await CheckAsync(userId, request, transaction, cancellationToken);
        if (details is null)
        {
            return new SaveTransactionResult(outcome);
        }

        // Moved to other accounts: the ones it leaves change too
        var before = await BalancesAsync(
            userId, [.. AccountsOf(transaction).Concat(AccountsOf(details)).Distinct()], cancellationToken);
        transaction.Update(details, clock.GetUtcNow());
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

        var before = await BalancesAsync(userId, AccountsOf(transaction), cancellationToken);
        dbContext.Transactions.Remove(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new DeletedTransaction(await ChangesAsync(userId, before, cancellationToken));
    }

    /// <summary>Only the person's own transactions: someone else's id is as good as a made-up one.</summary>
    private Task<Transaction?> FindAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken) =>
        dbContext.Transactions.SingleOrDefaultAsync(
            transaction => transaction.Id == transactionId && transaction.UserId == userId, cancellationToken);

    /// <summary>
    /// The accounts must be the person's and in use, the category of the type's kind; a change may keep the archived
    /// account or category it already has. A transfer (F-019) needs its To account the same way, and what that account
    /// got: the amount itself between accounts in one currency, the request's own figure for an exchange. The details
    /// to save come back when it may be saved.
    /// </summary>
    private async Task<(SaveTransactionOutcome Outcome, TransactionDetails? Details)> CheckAsync(
        Guid userId, SaveTransactionRequest request, Transaction? current, CancellationToken cancellationToken)
    {
        var account = await AccountAsync(userId, request.AccountId, current?.AccountId, cancellationToken);
        if (account is null)
        {
            return (SaveTransactionOutcome.NoSuchAccount, null);
        }

        if (request.Type == TransactionType.Transfer)
        {
            var to = await AccountAsync(
                userId, request.ToAccountId ?? Guid.Empty, current?.ToAccountId, cancellationToken);
            if (to is null)
            {
                return (SaveTransactionOutcome.NoSuchToAccount, null);
            }

            var toAmount = to.Currency == account.Currency ? request.Amount : request.ToAmount;
            if (toAmount is null)
            {
                return (SaveTransactionOutcome.ToAmountMissing, null);
            }

            return (SaveTransactionOutcome.Saved, new TransactionDetails(
                request.Type, request.Date, account.Id, null, request.Amount, request.Note, to.Id, toAmount));
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
            return (SaveTransactionOutcome.NoSuchCategory, null);
        }

        return (SaveTransactionOutcome.Saved, new TransactionDetails(
            request.Type, request.Date, account.Id, request.CategoryId, request.Amount, request.Note));
    }

    /// <summary>The person's account if it is in use, or the archived one a change already had (<paramref name="kept"/>).</summary>
    private async Task<Account?> AccountAsync(
        Guid userId, Guid accountId, Guid? kept, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts.AsNoTracking().SingleOrDefaultAsync(
            account => account.Id == accountId && account.UserId == userId, cancellationToken);

        return account is null || (account.IsArchived && account.Id != kept) ? null : account;
    }

    /// <summary>The accounts whose balances it changes: its own, and a transfer's To.</summary>
    private static Guid[] AccountsOf(TransactionDetails details) =>
        details.ToAccountId is { } to ? [details.AccountId, to] : [details.AccountId];

    private static Guid[] AccountsOf(Transaction transaction) =>
        transaction.ToAccountId is { } to ? [transaction.AccountId, to] : [transaction.AccountId];

    private async Task<SaveTransactionResult> SavedAsync(
        Guid userId, Transaction transaction, Dictionary<Guid, decimal> before, CancellationToken cancellationToken)
    {
        var item = await ItemsOf(dbContext.Transactions.Where(saved => saved.Id == transaction.Id))
            .SingleAsync(cancellationToken);

        return new SaveTransactionResult(
            SaveTransactionOutcome.Saved,
            new SavedTransaction(item, await ChangesAsync(userId, before, cancellationToken)));
    }

    /// <summary>
    /// The transactions as the lists show them, the latest first: newest day, then the last added. A transfer has no
    /// category; an expense or an income no To account.
    /// </summary>
    private IQueryable<TransactionItem> ItemsOf(IQueryable<Transaction> transactions) =>
        from transaction in transactions.AsNoTracking()
        join account in dbContext.Accounts on transaction.AccountId equals account.Id
        join category in dbContext.Categories on transaction.CategoryId equals category.Id into categories
        from category in categories.DefaultIfEmpty()
        join toAccount in dbContext.Accounts on transaction.ToAccountId equals toAccount.Id into toAccounts
        from toAccount in toAccounts.DefaultIfEmpty()
        orderby transaction.Date descending, transaction.CreatedAt descending
        select new TransactionItem(
            transaction.Id,
            transaction.Type,
            transaction.Date,
            account.Id,
            account.Name,
            account.Currency,
            transaction.CategoryId,
            category == null ? null : category.Name,
            transaction.Amount,
            transaction.Note,
            transaction.ToAccountId,
            toAccount == null ? null : toAccount.Name,
            toAccount == null ? null : toAccount.Currency,
            transaction.ToAmount);

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
