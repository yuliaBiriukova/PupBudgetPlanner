namespace PupBudgetPlanner.Domain.Budgets;

/// <summary>
/// One person's plan for one month (F-033): a total for the month and budgets per expense group and category, each
/// optional. The row itself says the month is planned, also when it was started empty. Nothing carries over between
/// months; a new month starts as a copy of the last planned one.
/// </summary>
public sealed class BudgetMonth
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    /// <summary>The month's first day.</summary>
    public DateOnly Month { get; init; }

    /// <summary>The month's total, in the report currency; none when only groups or categories are planned.</summary>
    public decimal? Total { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    public ICollection<GroupBudget> Groups { get; } = [];

    public ICollection<CategoryBudget> Categories { get; } = [];

    /// <summary>A month planned now, empty or with <paramref name="from"/>'s amounts (all three levels).</summary>
    public static BudgetMonth Start(Guid userId, DateOnly month, DateTimeOffset now, BudgetMonth? from = null)
    {
        var started = new BudgetMonth
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            Month = FirstDayOf(month),
            CreatedAt = now,
            Total = from?.Total,
        };
        foreach (var group in from?.Groups ?? [])
        {
            started.Groups.Add(new GroupBudget { BudgetMonthId = started.Id, GroupId = group.GroupId, Amount = group.Amount });
        }

        foreach (var category in from?.Categories ?? [])
        {
            started.Categories.Add(new CategoryBudget
            {
                BudgetMonthId = started.Id, CategoryId = category.CategoryId, Amount = category.Amount,
            });
        }

        return started;
    }

    public static DateOnly FirstDayOf(DateOnly day) => new(day.Year, day.Month, 1);

    /// <summary>The plan as the rules see it.</summary>
    public BudgetPlan Plan => new(
        Total,
        Groups.ToDictionary(group => group.GroupId, group => group.Amount),
        Categories.ToDictionary(category => category.CategoryId, category => category.Amount));

    /// <summary>Sets the month's total, whole (ADR 0018); none removes it.</summary>
    public void SetTotal(decimal? amount) => Total = amount is { } value ? Money.Whole(value) : null;

    /// <summary>Sets a group's own budget; none removes it (the group then counts with its categories' sum).</summary>
    public void SetGroup(Guid groupId, decimal? amount)
    {
        var current = Groups.FirstOrDefault(group => group.GroupId == groupId);
        if (amount is null)
        {
            if (current is not null)
            {
                Groups.Remove(current);
            }

            return;
        }

        if (current is null)
        {
            Groups.Add(new GroupBudget { BudgetMonthId = Id, GroupId = groupId, Amount = Money.Whole(amount.Value) });
        }
        else
        {
            current.Amount = Money.Whole(amount.Value);
        }
    }

    /// <summary>Sets a category's budget; none removes it.</summary>
    public void SetCategory(Guid categoryId, decimal? amount)
    {
        var current = Categories.FirstOrDefault(category => category.CategoryId == categoryId);
        if (amount is null)
        {
            if (current is not null)
            {
                Categories.Remove(current);
            }

            return;
        }

        if (current is null)
        {
            Categories.Add(new CategoryBudget
            {
                BudgetMonthId = Id, CategoryId = categoryId, Amount = Money.Whole(amount.Value),
            });
        }
        else
        {
            current.Amount = Money.Whole(amount.Value);
        }
    }
}

/// <summary>An expense group's own budget in one month.</summary>
public sealed class GroupBudget
{
    public Guid BudgetMonthId { get; init; }

    public Guid GroupId { get; init; }

    public decimal Amount { get; set; }
}

/// <summary>An expense category's budget in one month.</summary>
public sealed class CategoryBudget
{
    public Guid BudgetMonthId { get; init; }

    public Guid CategoryId { get; init; }

    public decimal Amount { get; set; }
}
