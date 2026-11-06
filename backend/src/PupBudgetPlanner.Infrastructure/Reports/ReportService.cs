using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Reports;
using PupBudgetPlanner.Domain.Transactions;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Reports;

internal sealed class ReportService(AppDbContext dbContext, IExchangeRateService rates, TimeProvider clock)
    : IReportService
{
    public async Task<Report> ReportAsync(
        Guid userId, ReportPeriod period, string? currency, CancellationToken cancellationToken)
    {
        currency ??= await dbContext.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.ReportCurrency)
            .SingleOrDefaultAsync(cancellationToken) ?? ReportCurrency.Default;
        var today = Kyiv.Today(clock);
        var data = await DataAsync(userId, period, cancellationToken);

        // Rates are kept once asked for (ADR 0019): only days not kept yet ask the NBU, one at a time
        var ratesOf = new Dictionary<DateOnly, DayRates>();
        foreach (var day in ReportBuilder.RateDaysOf(period, currency, today, data))
        {
            ratesOf[day] = await rates.RatesOnAsync(day, cancellationToken);
        }

        return ReportBuilder.Build(period, currency, today, data, ratesOf);
    }

    private async Task<ReportData> DataAsync(Guid userId, ReportPeriod period, CancellationToken cancellationToken)
    {
        var groups = await dbContext.CategoryGroups.AsNoTracking()
            .Where(group => group.UserId == userId)
            .Include(group => group.Categories)
            .ToListAsync(cancellationToken);

        var transactions = dbContext.Transactions.AsNoTracking().Where(transaction => transaction.UserId == userId);

        // Transfers are neither income nor expense (business rule 2): they only move the balances below
        var amounts = await (
                from transaction in transactions
                where transaction.Type != TransactionType.Transfer &&
                      transaction.Date >= period.First && transaction.Date <= period.Last
                join account in dbContext.Accounts on transaction.AccountId equals account.Id
                group transaction by new { transaction.Date, transaction.Type, account.Currency, transaction.CategoryId }
                into same
                select new ReportAmount(
                    same.Key.Date,
                    same.Key.Type,
                    same.Key.Currency,
                    same.Key.CategoryId!.Value,
                    same.Sum(transaction => transaction.Amount)))
            .ToListAsync(cancellationToken);

        var accounts = (await dbContext.Accounts.AsNoTracking()
                .Where(account => account.UserId == userId)
                .ToListAsync(cancellationToken))
            .Select(account => new ReportAccount(
                account.Id,
                account.Currency,
                account.OpeningBalance,
                account.OpeningDate,
                account.ArchivedAt is { } archivedAt ? Kyiv.DateOf(archivedAt) : null))
            .ToList();

        // Each account's movement a month up to the period's end, on both sides of a transfer (F-019)
        var upToEnd = transactions.Where(transaction => transaction.Date <= period.Last);
        var outgoing = await upToEnd
            .GroupBy(transaction => new
            {
                transaction.AccountId, transaction.Type, transaction.Date.Year, transaction.Date.Month,
            })
            .Select(same => new
            {
                same.Key.AccountId,
                same.Key.Type,
                same.Key.Year,
                same.Key.Month,
                Amount = same.Sum(transaction => transaction.Amount),
            })
            .ToListAsync(cancellationToken);
        var incoming = await upToEnd
            .Where(transaction => transaction.ToAccountId != null)
            .GroupBy(transaction => new { AccountId = transaction.ToAccountId!.Value, transaction.Date.Year, transaction.Date.Month })
            .Select(same => new MonthMovement(
                same.Key.AccountId, same.Key.Year, same.Key.Month, same.Sum(transaction => transaction.ToAmount ?? 0)))
            .ToListAsync(cancellationToken);
        var movements = outgoing
            .Select(sum => new MonthMovement(
                sum.AccountId, sum.Year, sum.Month, Transaction.MovementOf(sum.Type, sum.Amount)))
            .Concat(incoming)
            .ToList();

        var firstTransaction = await transactions.MinAsync(transaction => (DateOnly?)transaction.Date, cancellationToken);
        var firstOpening = accounts.Count == 0 ? (DateOnly?)null : accounts.Min(account => account.OpeningDate);
        var firstDay = new[] { firstTransaction, firstOpening }.Min();

        return new ReportData(groups, amounts, accounts, movements, firstDay);
    }
}
