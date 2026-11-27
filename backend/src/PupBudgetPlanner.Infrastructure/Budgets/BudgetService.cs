using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Jars;
using PupBudgetPlanner.Domain.Transactions;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Budgets;

internal sealed class BudgetService(AppDbContext dbContext, IExchangeRateService rates, TimeProvider clock)
    : IBudgetService
{
    public async Task<MonthBudget> MonthAsync(Guid userId, DateOnly month, CancellationToken cancellationToken)
    {
        month = BudgetMonth.FirstDayOf(month);
        var currency = await dbContext.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.ReportCurrency)
            .SingleOrDefaultAsync(cancellationToken) ?? ReportCurrency.Default;
        var groups = await ExpenseGroupsAsync(userId, cancellationToken);
        var plan = await PlanOfAsync(userId, month, tracked: false, cancellationToken);
        var startFrom = plan is null ? await LastPlannedBeforeAsync(userId, month, cancellationToken) : null;

        var last = month.AddMonths(1).AddDays(-1);
        var spending = await (
                from transaction in dbContext.Transactions.AsNoTracking()
                where transaction.UserId == userId && transaction.Type == TransactionType.Expense &&
                      transaction.Date >= month && transaction.Date <= last
                join account in dbContext.Accounts on transaction.AccountId equals account.Id
                group transaction by new { transaction.Date, account.Currency, transaction.CategoryId }
                into same
                select new BudgetSpending(
                    same.Key.Date, same.Key.Currency, same.Key.CategoryId!.Value, same.Sum(t => t.Amount)))
            .ToListAsync(cancellationToken);
        // The month's income, for its saved money (F-034)
        var income = await (
                from transaction in dbContext.Transactions.AsNoTracking()
                where transaction.UserId == userId && transaction.Type == TransactionType.Income &&
                      transaction.Date >= month && transaction.Date <= last
                join account in dbContext.Accounts on transaction.AccountId equals account.Id
                group transaction by new { transaction.Date, account.Currency }
                into same
                select new BudgetSpending(same.Key.Date, same.Key.Currency, Guid.Empty, same.Sum(t => t.Amount)))
            .ToListAsync(cancellationToken);

        // Only the days with money in another currency need their rates (kept once asked for, ADR 0019)
        var ratesOf = new Dictionary<DateOnly, IReadOnlyDictionary<string, decimal>>();
        foreach (var day in spending.Concat(income).Where(row => row.Currency != currency).Select(row => row.Date)
                     .Distinct())
        {
            ratesOf[day] = (await rates.RatesOnAsync(day, cancellationToken)).ToUah;
        }

        var jars = await JarLinesAsync(plan, month, last, cancellationToken);
        var savedIntoJars = await (
                from move in dbContext.JarMoves.AsNoTracking()
                join jar in dbContext.Jars on move.JarId equals jar.Id
                where jar.UserId == userId && move.Kind == JarMoveKind.SavedMoney && move.Month == month
                select move.Amount)
            .SumAsync(cancellationToken);

        return BudgetBuilder.Build(
            month, currency, groups, plan, startFrom, spending, income, ratesOf, jars, savedIntoJars);
    }

    /// <summary>The month's plan for jars, in the order they were planned (F-034), with what went in that month.</summary>
    private async Task<IReadOnlyList<BudgetJarLine>> JarLinesAsync(
        BudgetMonth? plan, DateOnly month, DateOnly last, CancellationToken cancellationToken)
    {
        if (plan is null || plan.Jars.Count == 0)
        {
            return [];
        }

        var ids = plan.Jars.Select(line => line.JarId).ToList();
        var jars = await dbContext.Jars.AsNoTracking().Where(jar => ids.Contains(jar.Id))
            .ToDictionaryAsync(jar => jar.Id, cancellationToken);
        var setAside = await dbContext.JarMoves.AsNoTracking()
            .Where(move => ids.Contains(move.JarId) && move.Date >= month && move.Date <= last)
            .GroupBy(move => move.JarId)
            .Select(moves => new { JarId = moves.Key, Amount = moves.Sum(move => move.Amount) })
            .ToDictionaryAsync(row => row.JarId, row => row.Amount, cancellationToken);
        return plan.Jars
            .Where(line => jars.ContainsKey(line.JarId))
            .OrderBy(line => line.Order)
            .Select(line =>
            {
                var jar = jars[line.JarId];
                return new BudgetJarLine(
                    jar.Id, jar.Name, jar.Icon, jar.Color, line.Amount, setAside.GetValueOrDefault(jar.Id), jar.IsClosed);
            })
            .ToList();
    }

    public async Task<BudgetResult> StartAsync(
        Guid userId, DateOnly month, bool copyLast, CancellationToken cancellationToken)
    {
        month = BudgetMonth.FirstDayOf(month);
        if (await PlanOfAsync(userId, month, tracked: false, cancellationToken) is not null)
        {
            return new BudgetResult(BudgetOutcome.AlreadyPlanned);
        }

        BudgetMonth? from = null;
        if (copyLast && await LastPlannedBeforeAsync(userId, month, cancellationToken) is { } last)
        {
            from = await PlanOfAsync(userId, last, tracked: false, cancellationToken);
        }

        // A copy keeps only the groups and categories that are still the person's expense ones
        var shapes = BudgetBuilder.ShapesOf(await ExpenseGroupsAsync(userId, cancellationToken));
        var started = BudgetMonth.Start(userId, month, clock.GetUtcNow(), from);
        var groupIds = shapes.Select(shape => shape.Id).ToHashSet();
        var categoryIds = shapes.SelectMany(shape => shape.CategoryIds).ToHashSet();
        foreach (var gone in started.Groups.Where(group => !groupIds.Contains(group.GroupId)).ToList())
        {
            started.Groups.Remove(gone);
        }

        foreach (var gone in started.Categories.Where(category => !categoryIds.Contains(category.CategoryId)).ToList())
        {
            started.Categories.Remove(gone);
        }

        // And only the jars still open (F-034)
        var openJars = (await OpenJarsAsync(userId, null, cancellationToken)).Select(jar => jar.Id).ToHashSet();
        foreach (var gone in started.Jars.Where(jar => !openJars.Contains(jar.JarId)).ToList())
        {
            started.Jars.Remove(gone);
        }

        dbContext.BudgetMonths.Add(started);
        await dbContext.SaveChangesAsync(cancellationToken);
        return BudgetResult.Done;
    }

    public Task<BudgetResult> SetTotalAsync(
        Guid userId, DateOnly month, decimal? amount, CancellationToken cancellationToken) =>
        ChangeAsync(userId, month, _ => true, plan => plan.SetTotal(amount), cancellationToken);

    public Task<BudgetResult> SetGroupAsync(
        Guid userId, DateOnly month, Guid groupId, decimal? amount, CancellationToken cancellationToken) =>
        ChangeAsync(
            userId,
            month,
            shapes => shapes.Any(shape => shape.Id == groupId),
            plan => plan.SetGroup(groupId, amount),
            cancellationToken);

    public Task<BudgetResult> SetCategoryAsync(
        Guid userId, DateOnly month, Guid categoryId, decimal? amount, CancellationToken cancellationToken) =>
        ChangeAsync(
            userId,
            month,
            shapes => shapes.Any(shape => shape.CategoryIds.Contains(categoryId)),
            plan => plan.SetCategory(categoryId, amount),
            cancellationToken);

    public async Task<BudgetResult> SetJarAsync(
        Guid userId, DateOnly month, Guid jarId, decimal? amount, CancellationToken cancellationToken)
    {
        // Only an open jar in the month's currency (the report currency) can be planned; one already planned can be
        // taken out whatever it is now
        var currency = await ReportCurrencyOfAsync(userId, cancellationToken);
        var plannable = (await OpenJarsAsync(userId, currency, cancellationToken)).Any(jar => jar.Id == jarId);
        var planned = await dbContext.BudgetMonths.AsNoTracking()
            .AnyAsync(
                plan => plan.UserId == userId && plan.Month == BudgetMonth.FirstDayOf(month) &&
                        plan.Jars.Any(line => line.JarId == jarId),
                cancellationToken);
        return await ChangeAsync(
            userId,
            month,
            _ => plannable || (amount is null && planned),
            plan => plan.SetJar(jarId, amount),
            cancellationToken);
    }

    private async Task<string> ReportCurrencyOfAsync(Guid userId, CancellationToken cancellationToken) =>
        await dbContext.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.ReportCurrency)
            .SingleOrDefaultAsync(cancellationToken) ?? ReportCurrency.Default;

    private Task<List<Jar>> OpenJarsAsync(Guid userId, string? currency, CancellationToken cancellationToken) =>
        dbContext.Jars.AsNoTracking()
            .Where(jar => jar.UserId == userId && jar.ClosedAt == null && (currency == null || jar.Currency == currency))
            .ToListAsync(cancellationToken);

    public async Task<BudgetResult> DeleteAsync(Guid userId, DateOnly month, CancellationToken cancellationToken)
    {
        month = BudgetMonth.FirstDayOf(month);
        // Its group, category and jar budgets go with it (cascade)
        var deleted = await dbContext.BudgetMonths
            .Where(plan => plan.UserId == userId && plan.Month == month)
            .ExecuteDeleteAsync(cancellationToken);
        return new BudgetResult(deleted == 0 ? BudgetOutcome.NotPlanned : BudgetOutcome.Done);
    }

    /// <summary>
    /// Changes one line of the month's plan, planning the month (empty) first if it wasn't; refused when it makes a
    /// level hold more than it may (F-033).
    /// </summary>
    private async Task<BudgetResult> ChangeAsync(
        Guid userId,
        DateOnly month,
        Func<IReadOnlyList<BudgetGroupShape>, bool> exists,
        Action<BudgetMonth> change,
        CancellationToken cancellationToken)
    {
        month = BudgetMonth.FirstDayOf(month);
        var shapes = BudgetBuilder.ShapesOf(await ExpenseGroupsAsync(userId, cancellationToken));
        if (!exists(shapes))
        {
            return new BudgetResult(BudgetOutcome.NotFound);
        }

        var plan = await PlanOfAsync(userId, month, tracked: true, cancellationToken);
        if (plan is null)
        {
            plan = BudgetMonth.Start(userId, month, clock.GetUtcNow());
            dbContext.BudgetMonths.Add(plan);
        }

        var before = plan.Plan;
        change(plan);
        if (plan.Plan.WorseThan(before, shapes) is { } overflow)
        {
            return new BudgetResult(BudgetOutcome.Overflow, overflow);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return BudgetResult.Done;
    }

    private Task<List<CategoryGroup>> ExpenseGroupsAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.CategoryGroups.AsNoTracking()
            .Where(group => group.UserId == userId && group.Kind == CategoryKind.Expense)
            .Include(group => group.Categories)
            .ToListAsync(cancellationToken);

    private async Task<BudgetMonth?> PlanOfAsync(
        Guid userId, DateOnly month, bool tracked, CancellationToken cancellationToken)
    {
        var query = dbContext.BudgetMonths
            .Where(plan => plan.UserId == userId && plan.Month == month)
            .Include(plan => plan.Groups)
            .Include(plan => plan.Categories)
            .Include(plan => plan.Jars)
            .AsSplitQuery();
        return await (tracked ? query : query.AsNoTracking()).SingleOrDefaultAsync(cancellationToken);
    }

    private async Task<DateOnly?> LastPlannedBeforeAsync(Guid userId, DateOnly month, CancellationToken cancellationToken) =>
        await dbContext.BudgetMonths.AsNoTracking()
            .Where(plan => plan.UserId == userId && plan.Month < month)
            .OrderByDescending(plan => plan.Month)
            .Select(plan => (DateOnly?)plan.Month)
            .FirstOrDefaultAsync(cancellationToken);
}
