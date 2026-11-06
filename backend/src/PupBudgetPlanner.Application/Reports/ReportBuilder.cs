using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.ExchangeRates;

namespace PupBudgetPlanner.Application.Reports;

/// <summary>
/// Works the report out (F-021) from what the database summed and the NBU rates of the days it needs. Pure, so it is
/// tested without a database (ARCHITECTURE.md, ADR 0027).
/// </summary>
public static class ReportBuilder
{
    /// <summary>
    /// The days whose rates the report needs: those with an income or an expense in another currency than
    /// <paramref name="currency"/>, and the month ends (today for this month) whose balance has an account in another
    /// one, the month before the period included.
    /// </summary>
    public static IReadOnlyList<DateOnly> RateDaysOf(
        ReportPeriod period, string currency, DateOnly today, ReportData data)
    {
        var amountDays = data.Amounts.Where(amount => amount.Currency != currency).Select(amount => amount.Date);
        var balanceDays = BalanceMonths(period, today)
            .Where(month => CountedIn(data.Accounts, month).Any(account => account.Currency != currency))
            .Select(month => BalanceDay(month, today));

        return amountDays.Concat(balanceDays).Distinct().Order().ToList();
    }

    /// <summary>
    /// The report in <paramref name="currency"/>. <paramref name="rates"/> has the days <see cref="RateDaysOf"/> named;
    /// a day without them has none, and what needed them is left out and marked rather than counted short.
    /// </summary>
    public static Report Build(
        ReportPeriod period,
        string currency,
        DateOnly today,
        ReportData data,
        IReadOnlyDictionary<DateOnly, DayRates> rates)
    {
        var thisMonth = MonthOf(today);
        var months = Enumerable.Range(0, period.Months).Select(index => period.First.AddMonths(index)).ToList();
        var states = months
            .Select(month => month < thisMonth ? ReportMonthState.Passed
                : month == thisMonth ? ReportMonthState.Current
                : ReportMonthState.Future)
            .ToList();
        var ratesMissing = new bool[months.Count];
        int? monthsCounted = period.IsYear ? MonthsCounted(period, thisMonth, data.FirstDay) : null;

        DayRates RatesOn(DateOnly day) => rates.GetValueOrDefault(day) ?? DayRates.Missing;

        // Each category's amount a month in the report currency, at the NBU rate of the amount's day
        var byCategory = new Dictionary<Guid, decimal[]>();
        foreach (var amount in data.Amounts)
        {
            var index = MonthsBetween(period.First, MonthOf(amount.Date));
            if (index < 0 || index >= months.Count)
            {
                continue;
            }

            if (!byCategory.TryGetValue(amount.CategoryId, out var sums))
            {
                sums = new decimal[months.Count];
                byCategory[amount.CategoryId] = sums;
            }

            var rate = amount.Currency == currency
                ? 1m
                : Conversion.Rate(amount.Currency, currency, RatesOn(amount.Date).ToUah);
            if (rate is null)
            {
                ratesMissing[index] = true;
                continue;
            }

            sums[index] += amount.Amount * rate.Value;
        }

        ReportLine Sums(decimal[] values)
        {
            var shown = values.Select((value, index) => Shown(states[index], value)).ToList();
            var total = shown.Sum() ?? 0m;
            decimal? average = monthsCounted is > 0 ? total / monthsCounted.Value : null;
            return new ReportLine(shown, total, average);
        }

        var groups = new List<ReportGroup>();
        var income = new decimal[months.Count];
        var expenses = new decimal[months.Count];
        foreach (var group in data.Groups.OrderBy(group => group.SortOrder))
        {
            var groupSums = new decimal[months.Count];
            var categories = new List<ReportCategory>();
            foreach (var category in group.Categories
                         .Where(category => !category.IsArchived || byCategory.ContainsKey(category.Id))
                         .OrderBy(category => category.SortOrder))
            {
                var sums = byCategory.GetValueOrDefault(category.Id) ?? new decimal[months.Count];
                AddTo(groupSums, sums);
                categories.Add(new ReportCategory(category.Id, category.Name, category.IsArchived, Sums(sums)));
            }

            AddTo(group.Kind == CategoryKind.Income ? income : expenses, groupSums);
            groups.Add(new ReportGroup(group.Id, group.Name, group.Kind, categories, Sums(groupSums)));
        }

        var net = income.Zip(expenses, (received, spent) => received - spent).ToArray();

        // What was really on the accounts at each month's end, and what of its change NET doesn't explain
        var (startBalance, _) = BalanceOf(period.First.AddMonths(-1), currency, today, data, RatesOn);
        var balances = new List<decimal?>();
        var otherChanges = new List<decimal?>();
        var balanceRates = new List<RatesOfDay?>();
        var previous = startBalance;
        for (var index = 0; index < months.Count; index++)
        {
            if (states[index] == ReportMonthState.Future)
            {
                balances.Add(null);
                otherChanges.Add(null);
                balanceRates.Add(null);
                continue;
            }

            var (balance, used) = BalanceOf(months[index], currency, today, data, RatesOn);
            balances.Add(balance);
            balanceRates.Add(used);
            otherChanges.Add(balance is { } end && previous is { } start && !ratesMissing[index]
                ? end - start - net[index]
                : null);
            previous = balance;
        }

        var passed = otherChanges.Where((_, index) => states[index] != ReportMonthState.Future).ToList();
        var summary = new ReportSummary(
            Sums(income),
            Sums(expenses),
            Sums(net),
            new ReportLine(otherChanges, passed.Any(change => change is null) ? null : passed.Sum(), null),
            new ReportLine(balances, null, null),
            startBalance);

        return new Report(
            currency,
            months.Select((month, index) => new ReportMonth(month, states[index], ratesMissing[index], balanceRates[index]))
                .ToList(),
            monthsCounted,
            groups,
            summary,
            data.FirstDay is { } firstDay ? MonthOf(firstDay) : null);
    }

    /// <summary>
    /// The balance at <paramref name="month"/>'s end (now, for this month) in <paramref name="currency"/>, with the
    /// rates it used when it needed any. An account counts from its opening date's month, and an archived one until the
    /// month before it was archived (F-021, open points 3 and 4); without a rate for one of their currencies there is
    /// no balance.
    /// </summary>
    private static (decimal? Balance, RatesOfDay? Used) BalanceOf(
        DateOnly month, string currency, DateOnly today, ReportData data, Func<DateOnly, DayRates> ratesOn)
    {
        var end = MonthKey(month);
        var totals = CountedIn(data.Accounts, month)
            .Select(account => (
                account.Currency,
                Balance: account.OpeningBalance + data.Movements
                    .Where(movement => movement.AccountId == account.Id && movement.Year * 12 + movement.Month <= end)
                    .Sum(movement => movement.Amount)))
            .GroupBy(account => account.Currency, account => account.Balance)
            .Select(same => (Currency: same.Key, Total: same.Sum()))
            .ToList();
        if (totals.All(total => total.Currency == currency))
        {
            return (totals.Sum(total => total.Total), null);
        }

        var rates = ratesOn(BalanceDay(month, today));
        decimal? balance = 0m;
        foreach (var total in totals)
        {
            var rate = total.Currency == currency ? 1m : Conversion.Rate(total.Currency, currency, rates.ToUah);
            balance = rate is null ? null : balance + (total.Total * rate.Value);
        }

        // In hryvnias, as the NBU publishes them: the accounts' other currencies, then the report currency (ADR 0020)
        var shown = totals
            .Select(total => total.Currency)
            .Append(currency)
            .Where(code => code != Currencies.Hryvnia)
            .Distinct()
            .Select(code => rates.ToUah.TryGetValue(code, out var rate) ? new RateItem(code, rate) : null)
            .OfType<RateItem>()
            .ToList();
        return (balance, new RatesOfDay(rates.Date, rates.Status, shown));
    }

    /// <summary>The accounts counted in <paramref name="month"/>'s end balance.</summary>
    private static IEnumerable<ReportAccount> CountedIn(IEnumerable<ReportAccount> accounts, DateOnly month)
    {
        var next = month.AddMonths(1);
        return accounts.Where(account =>
            account.OpeningDate < next && (account.ArchivedOn is not { } archived || archived >= next));
    }

    /// <summary>The months whose end balance the report needs: the one before the period, and each one not to come.</summary>
    private static IEnumerable<DateOnly> BalanceMonths(ReportPeriod period, DateOnly today) =>
        Enumerable.Range(-1, period.Months + 1)
            .Select(index => period.First.AddMonths(index))
            .Where(month => month <= MonthOf(today));

    /// <summary>The day whose rates convert a month's end balance: its last day, or today for this month.</summary>
    private static DateOnly BalanceDay(DateOnly month, DateOnly today) =>
        month == MonthOf(today) ? today : month.AddMonths(1).AddDays(-1);

    /// <summary>
    /// Avg's divisor (business rule 7): the year's months from the person's first month with data up to and including
    /// this one (F-021, open points 1 and 2); none passed, 0.
    /// </summary>
    private static int MonthsCounted(ReportPeriod period, DateOnly thisMonth, DateOnly? firstDay)
    {
        if (firstDay is not { } first)
        {
            return 0;
        }

        var from = MonthOf(first) > period.First ? MonthOf(first) : period.First;
        var lastMonth = period.First.AddMonths(period.Months - 1);
        var to = thisMonth < lastMonth ? thisMonth : lastMonth;
        return Math.Max(0, MonthsBetween(from, to) + 1);
    }

    private static decimal? Shown(ReportMonthState state, decimal value) =>
        state == ReportMonthState.Future ? null : value;

    private static void AddTo(decimal[] sums, decimal[] values)
    {
        for (var index = 0; index < sums.Length; index++)
        {
            sums[index] += values[index];
        }
    }

    private static DateOnly MonthOf(DateOnly day) => new(day.Year, day.Month, 1);

    private static int MonthKey(DateOnly month) => month.Year * 12 + month.Month;

    private static int MonthsBetween(DateOnly from, DateOnly to) => MonthKey(to) - MonthKey(from);
}
