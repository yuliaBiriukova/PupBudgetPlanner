using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Jars;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.ExchangeRates;
using PupBudgetPlanner.Domain.Jars;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Jars;

internal sealed class JarService(
    AppDbContext dbContext, IExchangeRateService rates, IBudgetService budgets, TimeProvider clock) : IJarService
{
    public async Task<IReadOnlyList<JarItem>> ListAsync(Guid userId, CancellationToken cancellationToken)
    {
        var jars = await dbContext.Jars.AsNoTracking()
            .Where(jar => jar.UserId == userId && jar.ClosedAt == null)
            .OrderBy(jar => jar.CreatedAt)
            .ToListAsync(cancellationToken);
        return await ItemsAsync(userId, jars, cancellationToken);
    }

    public async Task<JarResult> CreateAsync(Guid userId, SaveJarRequest request, CancellationToken cancellationToken)
    {
        var jar = Jar.Create(userId, DetailsOf(request), clock.GetUtcNow());
        dbContext.Jars.Add(jar);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await SavedAsync(userId, jar, cancellationToken);
    }

    public async Task<JarResult> UpdateAsync(
        Guid userId, Guid jarId, SaveJarRequest request, CancellationToken cancellationToken)
    {
        var jar = await FindAsync(userId, jarId, cancellationToken);
        if (jar is null)
        {
            return new JarResult(JarOutcome.NotFound);
        }

        if (jar.IsClosed)
        {
            return new JarResult(JarOutcome.Closed);
        }

        if (request.Currency != jar.Currency &&
            await dbContext.JarMoves.AnyAsync(move => move.JarId == jar.Id, cancellationToken))
        {
            return new JarResult(JarOutcome.CurrencyFixed);
        }

        jar.Update(DetailsOf(request));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await SavedAsync(userId, jar, cancellationToken);
    }

    public async Task<JarResult> CloseAsync(Guid userId, Guid jarId, CancellationToken cancellationToken)
    {
        var jar = await FindAsync(userId, jarId, cancellationToken);
        if (jar is null)
        {
            return new JarResult(JarOutcome.NotFound);
        }

        jar.Close(clock.GetUtcNow());
        // This month's plan and later ones no longer set money aside for it; earlier months keep what they planned
        var today = Kyiv.Today(clock);
        var thisMonth = new DateOnly(today.Year, today.Month, 1);
        var plans = await dbContext.BudgetMonths
            .Where(plan => plan.UserId == userId && plan.Month >= thisMonth)
            .Include(plan => plan.Jars)
            .ToListAsync(cancellationToken);
        foreach (var plan in plans)
        {
            plan.SetJar(jar.Id, null);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return JarResult.Done;
    }

    public async Task<JarResult> MoveAsync(
        Guid userId, Guid jarId, JarMoveRequest request, CancellationToken cancellationToken)
    {
        var jar = await FindAsync(userId, jarId, cancellationToken);
        var account = await dbContext.Accounts.AsNoTracking()
            .SingleOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId, cancellationToken);
        if (jar is null || account is null)
        {
            return new JarResult(JarOutcome.NotFound);
        }

        if (jar.IsClosed)
        {
            return new JarResult(JarOutcome.Closed);
        }

        var now = clock.GetUtcNow();
        var today = Kyiv.Today(clock);
        var amount = Domain.Money.Whole(request.Amount);
        if (request.Action == JarMoveAction.In)
        {
            if (account.IsArchived)
            {
                return new JarResult(JarOutcome.NotFound);
            }

            // From an account in another currency: at today's NBU rate (Q-014, 1), typed in the account's currency
            var intoJar = amount;
            if (account.Currency != jar.Currency)
            {
                var day = await rates.RatesOnAsync(today, cancellationToken);
                if (Conversion.Rate(account.Currency, jar.Currency, day.ToUah) is not { } rate)
                {
                    return new JarResult(JarOutcome.NoRate);
                }

                intoJar = Domain.Money.Whole(amount * rate);
                if (intoJar <= 0)
                {
                    return new JarResult(JarOutcome.NotEnough);
                }
            }

            dbContext.JarMoves.Add(JarMove.Of(jar.Id, account.Id, today, JarMoveKind.PutIn, intoJar, amount, now));
            await dbContext.SaveChangesAsync(cancellationToken);
            return await SavedAsync(userId, jar, cancellationToken);
        }

        // Out or to another jar: only what the jar has on that account
        var moves = await dbContext.JarMoves.AsNoTracking()
            .Where(move => move.JarId == jar.Id && move.AccountId == account.Id)
            .ToListAsync(cancellationToken);
        var places = JarMoney.PlacesOf(moves);
        var place = places.Count > 0 ? places[0] : null;
        if (place is null || amount > place.Amount)
        {
            return new JarResult(JarOutcome.NotEnough);
        }

        var share = JarMoney.AccountShareOf(place, amount);
        if (request.Action == JarMoveAction.Out)
        {
            dbContext.JarMoves.Add(JarMove.Of(jar.Id, account.Id, today, JarMoveKind.TakeOut, -amount, -share, now));
        }
        else
        {
            var other = request.ToJarId is { } toJarId ? await FindAsync(userId, toJarId, cancellationToken) : null;
            if (other is null)
            {
                return new JarResult(JarOutcome.NotFound);
            }

            if (other.Id == jar.Id || other.IsClosed || other.Currency != jar.Currency)
            {
                return new JarResult(JarOutcome.OtherJar);
            }

            dbContext.JarMoves.Add(JarMove.Of(
                jar.Id, account.Id, today, JarMoveKind.MovedOut, -amount, -share, now, other.Id));
            dbContext.JarMoves.Add(JarMove.Of(
                other.Id, account.Id, today, JarMoveKind.MovedIn, amount, share, now, jar.Id));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await SavedAsync(userId, jar, cancellationToken);
    }

    public async Task<JarResult> PutSavedMoneyAsync(
        Guid userId, SavedMoneyRequest request, CancellationToken cancellationToken)
    {
        var month = BudgetMonths.Parse(request.Month)!.Value;
        var budget = await budgets.MonthAsync(userId, month, cancellationToken);
        var saved = request.Way == SavedMoneyWay.Net ? budget.Saved.Net : budget.Saved.LeftOfBudgets;
        var given = request.Parts.Sum(part => Domain.Money.Whole(part.Amount));
        if (given > saved - budget.Saved.IntoJars)
        {
            return new JarResult(JarOutcome.TooMuch);
        }

        var jarIds = request.Parts.Select(part => part.JarId).ToList();
        var accountIds = request.Parts.Select(part => part.AccountId).ToList();
        var jars = await dbContext.Jars.AsNoTracking()
            .Where(jar => jar.UserId == userId && jarIds.Contains(jar.Id))
            .ToDictionaryAsync(jar => jar.Id, cancellationToken);
        var accounts = await dbContext.Accounts.AsNoTracking()
            .Where(account => account.UserId == userId && accountIds.Contains(account.Id))
            .ToDictionaryAsync(account => account.Id, cancellationToken);

        var now = clock.GetUtcNow();
        var today = Kyiv.Today(clock);
        foreach (var part in request.Parts)
        {
            if (!jars.TryGetValue(part.JarId, out var jar) || !accounts.TryGetValue(part.AccountId, out var account) ||
                account.IsArchived)
            {
                return new JarResult(JarOutcome.NotFound);
            }

            if (jar.IsClosed)
            {
                return new JarResult(JarOutcome.Closed);
            }

            // The saved money is in the month's currency: only jars and accounts in it
            if (jar.Currency != budget.Currency || account.Currency != jar.Currency)
            {
                return new JarResult(JarOutcome.WrongCurrency);
            }

            dbContext.JarMoves.Add(JarMove.Of(
                jar.Id, account.Id, today, JarMoveKind.SavedMoney, part.Amount, part.Amount, now, month: month));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return JarResult.Done;
    }

    private static JarDetails DetailsOf(SaveJarRequest request) => new(
        request.Name,
        request.Icon,
        request.Color,
        request.Currency,
        request.Goal,
        request.By is null ? null : BudgetMonths.Parse(request.By),
        request.Note);

    /// <summary>Only the person's own jars: someone else's id is as good as a made-up one.</summary>
    private Task<Jar?> FindAsync(Guid userId, Guid jarId, CancellationToken cancellationToken) =>
        dbContext.Jars.SingleOrDefaultAsync(jar => jar.Id == jarId && jar.UserId == userId, cancellationToken);

    private async Task<JarResult> SavedAsync(Guid userId, Jar jar, CancellationToken cancellationToken) =>
        new(JarOutcome.Done, (await ItemsAsync(userId, [jar], cancellationToken))[0]);

    /// <summary>The jars as the page shows them: money, where it lies, history and this month's plan.</summary>
    private async Task<IReadOnlyList<JarItem>> ItemsAsync(
        Guid userId, IReadOnlyList<Jar> jars, CancellationToken cancellationToken)
    {
        var ids = jars.Select(jar => jar.Id).ToList();
        var moves = await dbContext.JarMoves.AsNoTracking()
            .Where(move => ids.Contains(move.JarId))
            .ToListAsync(cancellationToken);
        var accountIds = moves.Select(move => move.AccountId).Distinct().ToList();
        var accounts = await dbContext.Accounts.AsNoTracking()
            .Where(account => accountIds.Contains(account.Id))
            .ToDictionaryAsync(account => account.Id, cancellationToken);
        var otherIds = moves.Select(move => move.OtherJarId).OfType<Guid>().Distinct().ToList();
        var otherNames = await dbContext.Jars.AsNoTracking()
            .Where(jar => otherIds.Contains(jar.Id))
            .ToDictionaryAsync(jar => jar.Id, jar => jar.Name, cancellationToken);

        var today = Kyiv.Today(clock);
        var thisMonth = new DateOnly(today.Year, today.Month, 1);
        var planned = await dbContext.BudgetMonths.AsNoTracking()
            .Where(plan => plan.UserId == userId && plan.Month == thisMonth)
            .SelectMany(plan => plan.Jars)
            .ToDictionaryAsync(line => line.JarId, line => line.Amount, cancellationToken);

        return jars.Select(jar =>
            {
                var own = moves.Where(move => move.JarId == jar.Id).ToList();
                return new JarItem(
                    jar.Id,
                    jar.Name,
                    jar.Icon,
                    jar.Color,
                    jar.Currency,
                    jar.Goal,
                    jar.TargetMonth is { } by ? BudgetBuilder.MonthText(by) : null,
                    jar.Note,
                    JarMoney.SavedIn(own),
                    JarMoney.PlacesOf(own)
                        .Where(place => accounts.ContainsKey(place.AccountId))
                        .Select(place =>
                        {
                            var account = accounts[place.AccountId];
                            return new JarPlaceItem(
                                account.Id, account.Name, account.Currency, place.Amount, place.AccountAmount);
                        })
                        .ToList(),
                    own.OrderByDescending(move => move.Date).ThenByDescending(move => move.CreatedAt)
                        .ThenBy(move => move.Kind)
                        .Select(move => HistoryLine(move, accounts[move.AccountId], otherNames))
                        .ToList(),
                    planned.TryGetValue(jar.Id, out var plan) ? plan : null,
                    own.Where(move => move.Date >= thisMonth).Sum(move => move.Amount),
                    jar.ClosedAt);
            })
            .ToList();
    }

    private static JarMoveItem HistoryLine(JarMove move, Account account, IReadOnlyDictionary<Guid, string> otherNames) =>
        new(
            move.Id,
            move.Date,
            move.Kind,
            move.Amount,
            account.Id,
            account.Name,
            account.Currency,
            move.AccountAmount,
            move.OtherJarId,
            move.OtherJarId is { } other ? otherNames.GetValueOrDefault(other) : null,
            move.Month is { } month ? BudgetBuilder.MonthText(month) : null);
}
