using System.Globalization;
using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.ExchangeRates;

namespace PupBudgetPlanner.Application.Budgets;

/// <summary>A month's expenses of one day, one account currency and one category, summed by the database.</summary>
public sealed record BudgetSpending(DateOnly Date, string Currency, Guid CategoryId, decimal Amount);

/// <summary>
/// Works the Budget page's month out (F-033) from the person's expense groups, the month's plan and expenses, and the
/// NBU rates of their days. Pure, so it is tested without a database.
/// </summary>
public static class BudgetBuilder
{
    public static string MonthText(DateOnly month) => month.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    /// <summary>
    /// <paramref name="groups"/> are the person's expense groups with every category; hidden ones show only with a
    /// budget or spending. <paramref name="rates"/>: hryvnias for one unit, by code, per day; a day without them has none.
    /// </summary>
    public static MonthBudget Build(
        DateOnly month,
        string currency,
        IReadOnlyList<CategoryGroup> groups,
        BudgetMonth? plan,
        DateOnly? startFrom,
        IReadOnlyList<BudgetSpending> spending,
        IReadOnlyDictionary<DateOnly, IReadOnlyDictionary<string, decimal>> rates)
    {
        var missing = false;
        var spent = new Dictionary<Guid, decimal>();
        foreach (var row in spending)
        {
            decimal? amount = row.Amount;
            if (row.Currency != currency)
            {
                var rate = rates.TryGetValue(row.Date, out var day) ? Conversion.Rate(row.Currency, currency, day) : null;
                amount = row.Amount * rate;
                missing |= rate is null;
            }

            spent[row.CategoryId] = spent.GetValueOrDefault(row.CategoryId) + (amount ?? 0);
        }

        var budgets = plan?.Plan;
        var lines = groups
            .Where(group => group.Kind == CategoryKind.Expense)
            .OrderBy(group => group.SortOrder)
            .Select(group =>
            {
                var categories = group.Categories
                    .OrderBy(category => category.IsArchived)
                    .ThenBy(category => category.SortOrder)
                    .Select(category => new BudgetCategoryLine(
                        category.Id,
                        category.Name,
                        budgets?.Categories.TryGetValue(category.Id, out var budget) == true ? budget : null,
                        spent.GetValueOrDefault(category.Id)))
                    .Where(line => !IsHidden(group, line.Id) || line.Budget is not null || line.Spent != 0)
                    .ToList();
                var own = budgets?.Groups.TryGetValue(group.Id, out var budget) == true ? budget : (decimal?)null;
                return new BudgetGroupLine(
                    group.Id,
                    group.Name,
                    own,
                    group.Categories.Sum(category => spent.GetValueOrDefault(category.Id)),
                    categories);
            })
            .Where(line => !groups.First(group => group.Id == line.Id).IsArchived ||
                           line.Budget is not null || line.Categories.Count > 0)
            .ToList();

        return new MonthBudget(
            MonthText(month),
            currency,
            plan is not null,
            plan is null && startFrom is { } from ? MonthText(from) : null,
            plan?.Total,
            spent.Values.Sum(),
            lines,
            missing);
    }

    private static bool IsHidden(CategoryGroup group, Guid categoryId) =>
        group.IsArchived || group.Categories.First(category => category.Id == categoryId).IsArchived;

    /// <summary>The shapes the rules check: every expense group with every category, hidden ones too.</summary>
    public static IReadOnlyList<BudgetGroupShape> ShapesOf(IEnumerable<CategoryGroup> groups) =>
        groups
            .Where(group => group.Kind == CategoryKind.Expense)
            .Select(group => new BudgetGroupShape(group.Id, group.Categories.Select(category => category.Id).ToList()))
            .ToList();
}
