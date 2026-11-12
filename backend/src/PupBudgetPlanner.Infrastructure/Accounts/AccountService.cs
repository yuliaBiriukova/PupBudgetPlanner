using Microsoft.EntityFrameworkCore;
using Npgsql;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Accounts;

internal sealed class AccountService(AppDbContext dbContext, IExchangeRateService rates, TimeProvider clock)
    : IAccountService
{
    public async Task<AccountsOverview> OverviewAsync(MoneyScope scope, CancellationToken cancellationToken)
    {
        var people = scope.People;
        var kept = scope.Kept;
        // Each person's oldest first, the viewer's before the others' (F-024); not the ones hidden from the viewer
        // (F-030)
        var accounts = (await dbContext.Accounts.AsNoTracking()
                .Where(account => people.Contains(account.UserId))
                .OrderBy(account => account.CreatedAt)
                .ToListAsync(cancellationToken))
            .Where(account => kept.Shows(account.Id))
            .OrderBy(account => IndexOf(people, account.UserId))
            .ToList();
        var sums = await dbContext.SumsOfAsync(people, null, cancellationToken);
        // The others' sources and banks only as far as the accounts shown name them
        var named = accounts.Select(account => account.SourceId ?? account.BankId).OfType<Guid>().ToHashSet();
        var viewerId = scope.ViewerId;
        var sources = (await dbContext.AccountSources.AsNoTracking()
                .Where(source => people.Contains(source.UserId))
                .OrderBy(source => source.Name)
                .Select(source => new { source.Id, source.Name, source.UserId })
                .ToListAsync(cancellationToken))
            .Where(source => source.UserId == viewerId || named.Contains(source.Id))
            .Select(source => new SourceItem(source.Id, source.Name))
            .ToList();
        var banks = (await dbContext.Banks.AsNoTracking()
                .Where(bank => people.Contains(bank.UserId))
                .OrderBy(bank => bank.Name)
                .Select(bank => new { bank.Id, bank.Name, bank.UserId })
                .ToListAsync(cancellationToken))
            .Where(bank => bank.UserId == viewerId || named.Contains(bank.Id))
            .Select(bank => new BankItem(bank.Id, bank.Name))
            .ToList();

        var sourceNames = sources.ToDictionary(source => source.Id, source => source.Name);
        var bankNames = banks.ToDictionary(bank => bank.Id, bank => bank.Name);
        var balances = BalanceSheet.BalancesOf(accounts, BalanceSheet.MovementsOf(sums));
        var counts = CountsOf(sums);
        var lastUsed = BalanceSheet.LastUsedOf(sums);
        var items = balances
            .Select(balance =>
            {
                // How many transactions and when the latest: not for an account whose lines the viewer doesn't see
                var lines = !kept.ShowsBalanceOnly(balance.Account.Id) &&
                            !kept.SharesTotalsOnly(balance.Account.UserId);
                return ToItem(
                    balance,
                    balance.Account.SourceId is { } sourceId ? sourceNames.GetValueOrDefault(sourceId) : null,
                    balance.Account.BankId is { } bankId ? bankNames.GetValueOrDefault(bankId) : null,
                    lines ? counts.GetValueOrDefault(balance.Account.Id) : 0,
                    lines && lastUsed.TryGetValue(balance.Account.Id, out var usedAt) ? usedAt : null);
            })
            .ToList();

        return new AccountsOverview(
            items.Where(item => item.ArchivedAt is null).ToList(),
            items.Where(item => item.ArchivedAt is not null).OrderByDescending(item => item.ArchivedAt).ToList(),
            BalanceSheet.TotalsOf(balances),
            sources,
            banks,
            Currencies.All);
    }

    public async Task<AccountsTotal> TotalAsync(MoneyScope scope, CancellationToken cancellationToken)
    {
        var accounts = (await dbContext.Accounts.AsNoTracking()
                .Where(account => scope.People.Contains(account.UserId))
                .ToListAsync(cancellationToken))
            .Where(account => scope.Kept.Shows(account.Id))
            .ToList();
        var sums = await dbContext.SumsOfAsync(scope.People, null, cancellationToken);
        var totals = BalanceSheet.TotalsOf(BalanceSheet.BalancesOf(accounts, BalanceSheet.MovementsOf(sums)));
        // The viewer's own, picked in Settings (F-016), whoever's money it is (F-024)
        var currency = await dbContext.Users.AsNoTracking()
            .Where(user => user.Id == scope.ViewerId)
            .Select(user => user.ReportCurrency)
            .SingleOrDefaultAsync(cancellationToken) ?? ReportCurrency.Default;
        var day = TotalInReportCurrency.NeedsRates(totals, currency)
            ? await rates.RatesOnAsync(Kyiv.Today(clock), cancellationToken)
            : null;

        return TotalInReportCurrency.Of(totals, currency, day);
    }

    public async Task<SaveAccountResult> CreateAsync(
        Guid userId, SaveAccountRequest request, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var details = await DetailsAsync(userId, request, now, cancellationToken);
        if (await HasCopyAsync(userId, details, null, cancellationToken))
        {
            return new SaveAccountResult(SaveAccountOutcome.Copy);
        }

        var account = Account.Create(userId, details, now);
        dbContext.Accounts.Add(account);

        return await SavedAsync(cancellationToken)
            ? new SaveAccountResult(SaveAccountOutcome.Saved, await ItemAsync(account, cancellationToken))
            : new SaveAccountResult(SaveAccountOutcome.Copy);
    }

    public async Task<SaveAccountResult> UpdateAsync(
        Guid userId, Guid accountId, SaveAccountRequest request, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return new SaveAccountResult(SaveAccountOutcome.NotFound);
        }

        if (request.Currency != account.Currency && await HasTransactionsAsync(account.Id, cancellationToken))
        {
            return new SaveAccountResult(SaveAccountOutcome.CurrencyFixed);
        }

        var details = await DetailsAsync(userId, request, clock.GetUtcNow(), cancellationToken);
        // An archived account doesn't count, so it can't be a copy until it is restored
        if (!account.IsArchived && await HasCopyAsync(userId, details, account.Id, cancellationToken))
        {
            return new SaveAccountResult(SaveAccountOutcome.Copy);
        }

        account.Update(details);

        return await SavedAsync(cancellationToken)
            ? new SaveAccountResult(SaveAccountOutcome.Saved, await ItemAsync(account, cancellationToken))
            : new SaveAccountResult(SaveAccountOutcome.Copy);
    }

    public async Task<bool> ArchiveAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return false;
        }

        account.Archive(clock.GetUtcNow());
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<RestoreAccountOutcome> RestoreAsync(
        Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return RestoreAccountOutcome.NotFound;
        }

        if (account.IsArchived && await HasCopyAsync(userId, account.Details, account.Id, cancellationToken))
        {
            return RestoreAccountOutcome.Copy;
        }

        account.Restore();
        return await SavedAsync(cancellationToken) ? RestoreAccountOutcome.Restored : RestoreAccountOutcome.Copy;
    }

    /// <summary>The owner chose that only an account without transactions can be deleted (I-011).</summary>
    public async Task<DeleteAccountOutcome> DeleteAsync(
        Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return DeleteAccountOutcome.NotFound;
        }

        if (await HasTransactionsAsync(account.Id, cancellationToken))
        {
            return DeleteAccountOutcome.HasTransactions;
        }

        dbContext.Accounts.Remove(account);
        await dbContext.SaveChangesAsync(cancellationToken);
        return DeleteAccountOutcome.Deleted;
    }

    /// <summary>Whether an account in use, other than <paramref name="except"/>, looks just like it (I-020).</summary>
    private async Task<bool> HasCopyAsync(
        Guid userId, AccountDetails details, Guid? except, CancellationToken cancellationToken)
    {
        var inUse = await dbContext.Accounts.AsNoTracking()
            .Where(account => account.UserId == userId && account.ArchivedAt == null)
            .ToListAsync(cancellationToken);
        return Account.CopyIn(inUse, details, except) is not null;
    }

    /// <summary>
    /// Saves the changes; false when the database's index finds a copy that the check above missed: two saves at the
    /// same moment (<see cref="AccountConfiguration.NoCopiesIndex"/>).
    /// </summary>
    private async Task<bool> SavedAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: AccountConfiguration.NoCopiesIndex,
        })
        {
            return false;
        }
    }

    private Task<bool> HasTransactionsAsync(Guid accountId, CancellationToken cancellationToken) =>
        dbContext.IsUsedAsync(accountId, cancellationToken);

    /// <summary>Where a person is in the scope's order: the viewer first.</summary>
    private static int IndexOf(IReadOnlyList<Guid> people, Guid userId)
    {
        for (var index = 0; index < people.Count; index++)
        {
            if (people[index] == userId)
            {
                return index;
            }
        }

        return people.Count;
    }

    private static Dictionary<Guid, int> CountsOf(IEnumerable<TransactionSum> sums) =>
        sums.GroupBy(sum => sum.AccountId).ToDictionary(group => group.Key, group => group.Sum(sum => sum.Count));

    /// <summary>Only the person's own accounts: someone else's id is as good as a made-up one.</summary>
    private Task<Account?> FindAsync(Guid userId, Guid accountId, CancellationToken cancellationToken) =>
        dbContext.Accounts.SingleOrDefaultAsync(
            account => account.Id == accountId && account.UserId == userId, cancellationToken);

    /// <summary>The form's values, with the own source or bank found by name, or added when it is new.</summary>
    private async Task<AccountDetails> DetailsAsync(
        Guid userId, SaveAccountRequest request, DateTimeOffset now, CancellationToken cancellationToken)
    {
        Guid? sourceId = request.Source == SourceKind.Own
            ? (await SourceAsync(userId, request.SourceName!, now, cancellationToken)).Id
            : null;
        Guid? bankId = request.Source == SourceKind.Bank
            ? (await BankAsync(userId, request.BankName!, now, cancellationToken)).Id
            : null;

        return new AccountDetails(
            request.Name,
            request.Currency,
            request.Source,
            sourceId,
            bankId,
            request.OpeningBalance,
            request.OpeningDate,
            request.CardStyle);
    }

    // A person has a few sources and banks: they are matched by name here, ignoring case in any alphabet

    private async Task<AccountSource> SourceAsync(
        Guid userId, string name, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var sources = await dbContext.AccountSources.Where(s => s.UserId == userId).ToListAsync(cancellationToken);
        var source = sources.Find(s => SameName(s.Name, name));
        if (source is null)
        {
            source = AccountSource.Create(userId, name, now);
            dbContext.AccountSources.Add(source);
        }

        return source;
    }

    private async Task<Bank> BankAsync(Guid userId, string name, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var banks = await dbContext.Banks.Where(b => b.UserId == userId).ToListAsync(cancellationToken);
        var bank = banks.Find(b => SameName(b.Name, name));
        if (bank is null)
        {
            bank = Bank.Create(userId, name, now);
            dbContext.Banks.Add(bank);
        }

        return bank;
    }

    private static bool SameName(string saved, string typed) =>
        string.Equals(saved, typed.Trim(), StringComparison.OrdinalIgnoreCase);

    /// <summary>The saved account as the page shows it; its source or bank was just found or added (tracked).</summary>
    private async Task<AccountItem> ItemAsync(Account account, CancellationToken cancellationToken)
    {
        var sourceName = account.SourceId is { } sourceId
            ? (await dbContext.AccountSources.FindAsync([sourceId], cancellationToken))?.Name
            : null;
        var bankName = account.BankId is { } bankId
            ? (await dbContext.Banks.FindAsync([bankId], cancellationToken))?.Name
            : null;

        var sums = await dbContext.SumsOfAsync([account.UserId], [account.Id], cancellationToken);

        return ToItem(
            BalanceSheet.BalancesOf([account], BalanceSheet.MovementsOf(sums))[0],
            sourceName,
            bankName,
            sums.Sum(sum => sum.Count),
            BalanceSheet.LastUsedOf(sums).TryGetValue(account.Id, out var usedAt) ? usedAt : null);
    }

    private static AccountItem ToItem(
        AccountBalance balance,
        string? sourceName,
        string? bankName,
        int transactionCount,
        DateTimeOffset? lastUsedAt)
    {
        var account = balance.Account;
        return new AccountItem(
            account.Id,
            account.UserId,
            account.Name,
            account.Currency,
            account.Source,
            account.SourceId,
            sourceName,
            account.BankId,
            bankName,
            account.OpeningBalance,
            account.OpeningDate,
            balance.Balance,
            account.CardStyle,
            account.ArchivedAt,
            transactionCount,
            lastUsedAt,
            account.FamilySees);
    }
}
