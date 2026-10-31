using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Accounts;

internal sealed class AccountService(AppDbContext dbContext, IExchangeRateService rates, TimeProvider clock)
    : IAccountService
{
    /// <summary>No transactions yet (F-018): every balance is the opening balance.</summary>
    private static readonly IReadOnlyDictionary<Guid, decimal> NoMovements = new Dictionary<Guid, decimal>();

    public async Task<AccountsOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken)
    {
        var accounts = await dbContext.Accounts.AsNoTracking()
            .Where(account => account.UserId == userId)
            .OrderBy(account => account.CreatedAt)
            .ToListAsync(cancellationToken);
        var sources = await dbContext.AccountSources.AsNoTracking()
            .Where(source => source.UserId == userId)
            .OrderBy(source => source.Name)
            .Select(source => new SourceItem(source.Id, source.Name))
            .ToListAsync(cancellationToken);
        var banks = await dbContext.Banks.AsNoTracking()
            .Where(bank => bank.UserId == userId)
            .OrderBy(bank => bank.Name)
            .Select(bank => new BankItem(bank.Id, bank.Name))
            .ToListAsync(cancellationToken);

        var sourceNames = sources.ToDictionary(source => source.Id, source => source.Name);
        var bankNames = banks.ToDictionary(bank => bank.Id, bank => bank.Name);
        var balances = BalanceSheet.BalancesOf(accounts, NoMovements);
        var items = balances
            .Select(balance => ToItem(
                balance,
                balance.Account.SourceId is { } sourceId ? sourceNames.GetValueOrDefault(sourceId) : null,
                balance.Account.BankId is { } bankId ? bankNames.GetValueOrDefault(bankId) : null))
            .ToList();

        return new AccountsOverview(
            items.Where(item => item.ArchivedAt is null).ToList(),
            items.Where(item => item.ArchivedAt is not null).OrderByDescending(item => item.ArchivedAt).ToList(),
            BalanceSheet.TotalsOf(balances),
            sources,
            banks,
            Currencies.All);
    }

    public async Task<AccountsTotal> TotalAsync(Guid userId, CancellationToken cancellationToken)
    {
        var accounts = await dbContext.Accounts.AsNoTracking()
            .Where(account => account.UserId == userId)
            .ToListAsync(cancellationToken);
        var totals = BalanceSheet.TotalsOf(BalanceSheet.BalancesOf(accounts, NoMovements));
        var currency = ReportCurrency.Default;
        var day = TotalInReportCurrency.NeedsRates(totals, currency)
            ? await rates.RatesOnAsync(Kyiv.Today(clock), cancellationToken)
            : null;

        return TotalInReportCurrency.Of(totals, currency, day);
    }

    public async Task<AccountItem> CreateAsync(
        Guid userId, SaveAccountRequest request, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var account = Account.Create(userId, await DetailsAsync(userId, request, now, cancellationToken), now);

        dbContext.Accounts.Add(account);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await ItemAsync(account, cancellationToken);
    }

    public async Task<AccountItem?> UpdateAsync(
        Guid userId, Guid accountId, SaveAccountRequest request, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return null;
        }

        account.Update(await DetailsAsync(userId, request, clock.GetUtcNow(), cancellationToken));
        await dbContext.SaveChangesAsync(cancellationToken);

        return await ItemAsync(account, cancellationToken);
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

    public async Task<bool> RestoreAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return false;
        }

        account.Restore();
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// No transactions yet (F-018), so every account can go. F-018 refuses an account that has any: the owner chose
    /// that only an account without transactions can be deleted (I-011).
    /// </summary>
    public async Task<bool> DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var account = await FindAsync(userId, accountId, cancellationToken);
        if (account is null)
        {
            return false;
        }

        dbContext.Accounts.Remove(account);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

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

        return ToItem(BalanceSheet.BalancesOf([account], NoMovements)[0], sourceName, bankName);
    }

    private static AccountItem ToItem(AccountBalance balance, string? sourceName, string? bankName)
    {
        var account = balance.Account;
        return new AccountItem(
            account.Id,
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
            account.ArchivedAt);
    }
}
