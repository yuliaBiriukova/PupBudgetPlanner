using PupBudgetPlanner.Domain.Budgets;

namespace PupBudgetPlanner.Application.Budgets;

/// <summary>
/// A category on the Budget page: its budget this month (none without one) and what was spent on it, in the report
/// currency. Hidden categories come only when they have a budget or spending.
/// </summary>
public sealed record BudgetCategoryLine(Guid Id, string Name, decimal? Budget, decimal Spent);

/// <summary>
/// An expense group on the Budget page: its own budget (none when it counts with its categories' sum) and what was spent
/// in all its categories, with or without a budget of their own.
/// </summary>
public sealed record BudgetGroupLine(
    Guid Id, string Name, decimal? Budget, decimal Spent, IReadOnlyList<BudgetCategoryLine> Categories);

/// <summary>
/// One person's month on the Budget page (F-033), in their report currency. <paramref name="Planned"/>: the month has a
/// plan (also an empty one); otherwise the amounts are none and <paramref name="StartFrom"/> names the last planned month
/// before it, which "Start from …" copies (none when there is none). <paramref name="Spent"/> is all the month's
/// expenses, what the total counts against. Spending in other currencies is at the NBU rate of each transaction's day;
/// <paramref name="RatesMissing"/>: some had no rate and aren't counted. Amounts are kept as they are and rounded when
/// shown (ADR 0018).
/// </summary>
public sealed record MonthBudget(
    string Month,
    string Currency,
    bool Planned,
    string? StartFrom,
    decimal? Total,
    decimal Spent,
    IReadOnlyList<BudgetGroupLine> Groups,
    bool RatesMissing);

/// <summary>Sets one budget of <paramref name="Month"/> (<c>yyyy-MM</c>); no amount removes it.</summary>
public sealed record SetBudgetRequest(string Month, decimal? Amount);

/// <summary>
/// Plans <paramref name="Month"/>: with <paramref name="CopyLast"/> as a copy of the last planned month before it (all
/// three levels), otherwise empty.
/// </summary>
public sealed record StartMonthRequest(string Month, bool CopyLast);

public enum BudgetOutcome
{
    Done,

    /// <summary>No such expense group or category of the person's.</summary>
    NotFound,

    /// <summary>The change makes a level hold more than it may (<see cref="BudgetResult.Overflow"/> says which).</summary>
    Overflow,

    /// <summary>The month is planned already (starting it again would lose its amounts).</summary>
    AlreadyPlanned,
}

public sealed record BudgetResult(BudgetOutcome Outcome, BudgetOverflow? Overflow = null)
{
    public static readonly BudgetResult Done = new(BudgetOutcome.Done);
}

/// <summary>
/// The person's monthly budget (F-033): personal (no family budget), expense groups and categories only. Implemented
/// with EF Core in Infrastructure.
/// </summary>
public interface IBudgetService
{
    Task<MonthBudget> MonthAsync(Guid userId, DateOnly month, CancellationToken cancellationToken);

    Task<BudgetResult> StartAsync(Guid userId, DateOnly month, bool copyLast, CancellationToken cancellationToken);

    Task<BudgetResult> SetTotalAsync(Guid userId, DateOnly month, decimal? amount, CancellationToken cancellationToken);

    Task<BudgetResult> SetGroupAsync(
        Guid userId, DateOnly month, Guid groupId, decimal? amount, CancellationToken cancellationToken);

    Task<BudgetResult> SetCategoryAsync(
        Guid userId, DateOnly month, Guid categoryId, decimal? amount, CancellationToken cancellationToken);
}
