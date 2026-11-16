namespace PupBudgetPlanner.Domain.Budgets;

/// <summary>An expense group as the budget rules see it: its id and its categories' ids.</summary>
public sealed record BudgetGroupShape(Guid Id, IReadOnlyCollection<Guid> CategoryIds);

/// <summary>
/// A level that holds more than it may (F-033): a group whose categories' budgets add up to more than its own
/// (<see cref="GroupId"/> set), or groups adding up to more than the month's total (no <see cref="GroupId"/>).
/// <see cref="Inside"/> is what it holds, <see cref="Budget"/> what it may hold; the difference is how much it goes over.
/// </summary>
public sealed record BudgetOverflow(Guid? GroupId, decimal Inside, decimal Budget)
{
    public decimal Over => Inside - Budget;

    public bool IsTotal => GroupId is null;
}

/// <summary>
/// A month's plan: the total, the groups' own budgets and the categories' budgets, each optional (F-033). Pure, so the
/// rules are tested without a database.
/// </summary>
public sealed record BudgetPlan(
    decimal? Total,
    IReadOnlyDictionary<Guid, decimal> Groups,
    IReadOnlyDictionary<Guid, decimal> Categories)
{
    /// <summary>The sum of a group's categories' budgets.</summary>
    public decimal InsideOf(BudgetGroupShape group) =>
        group.CategoryIds.Sum(id => Categories.GetValueOrDefault(id));

    /// <summary>What a group takes of the total: its own budget, or without one its categories' sum.</summary>
    public decimal TakenBy(BudgetGroupShape group) =>
        Groups.TryGetValue(group.Id, out var own) ? own : InsideOf(group);

    /// <summary>
    /// Each level fits within the one above it: a group's own budget holds its categories' budgets, and the groups (one
    /// without its own counting with its categories' sum) hold within the total. Every level that doesn't.
    /// </summary>
    public IReadOnlyList<BudgetOverflow> Overflows(IReadOnlyCollection<BudgetGroupShape> groups)
    {
        var overflows = new List<BudgetOverflow>();
        foreach (var group in groups)
        {
            var inside = InsideOf(group);
            if (Groups.TryGetValue(group.Id, out var own) && inside > own)
            {
                overflows.Add(new BudgetOverflow(group.Id, inside, own));
            }
        }

        var planned = groups.Sum(TakenBy);
        if (Total is { } total && planned > total)
        {
            overflows.Add(new BudgetOverflow(null, planned, total));
        }

        return overflows;
    }

    /// <summary>
    /// The first level this plan breaks that <paramref name="before"/> kept, or broke by less: a change is refused only for
    /// what it makes worse, so a plan already over (a category moved to another group, F-029) can still be put right one
    /// line at a time.
    /// </summary>
    public BudgetOverflow? WorseThan(BudgetPlan before, IReadOnlyCollection<BudgetGroupShape> groups)
    {
        var earlier = before.Overflows(groups);
        return Overflows(groups).FirstOrDefault(overflow =>
            earlier.FirstOrDefault(old => old.GroupId == overflow.GroupId) is not { } old || overflow.Over > old.Over);
    }
}
