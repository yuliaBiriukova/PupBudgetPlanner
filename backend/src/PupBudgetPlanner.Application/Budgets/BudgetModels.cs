using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Jars;

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
/// A jar in the month's plan (F-034): what the month plans to set aside into it, in the month's currency, and what went
/// in during the month, less what came out. A closed jar shows in the months it was planned in before it closed.
/// </summary>
public sealed record BudgetJarLine(
    Guid Id, string Name, JarIcon Icon, JarColor Color, decimal Planned, decimal SetAside, bool IsClosed);

/// <summary>
/// The month's saved money two ways (F-034), whole: <paramref name="LeftOfBudgets"/> is what's left of the groups'
/// budgets (nothing over counted), <paramref name="Net"/> the month's income minus its expenses (as in the report);
/// <paramref name="IntoJars"/> is what went into jars from this month's saved money already.
/// </summary>
public sealed record SavedMoney(decimal LeftOfBudgets, decimal Net, decimal IntoJars);

/// <summary>
/// One person's month on the Budget page (F-033), in their report currency. <paramref name="Planned"/>: the month has a
/// plan (also an empty one); otherwise the amounts are none and <paramref name="StartFrom"/> names the last planned month
/// before it, which "Start from …" copies (none when there is none). <paramref name="Spent"/> is all the month's
/// expenses, what the total counts against. Spending in other currencies is at the NBU rate of each transaction's day;
/// <paramref name="RatesMissing"/>: some had no rate and aren't counted. Amounts are kept as they are and rounded when
/// shown (ADR 0018). <paramref name="Income"/> is the month's income, <paramref name="Jars"/> its plan for jars, in the
/// plan's order, and <paramref name="Saved"/> its saved money (F-034).
/// </summary>
public sealed record MonthBudget(
    string Month,
    string Currency,
    bool Planned,
    string? StartFrom,
    decimal? Total,
    decimal Spent,
    IReadOnlyList<BudgetGroupLine> Groups,
    bool RatesMissing,
    decimal Income,
    IReadOnlyList<BudgetJarLine> Jars,
    SavedMoney Saved);

/// <summary>Sets one budget of <paramref name="Month"/> (<c>yyyy-MM</c>); no amount removes it.</summary>
public sealed record SetBudgetRequest(string Month, decimal? Amount);

/// <summary>
/// Plans <paramref name="Month"/>: with <paramref name="CopyLast"/> as a copy of the last planned month before it (all
/// three levels and the jars), otherwise empty.
/// </summary>
public sealed record StartMonthRequest(string Month, bool CopyLast);

public enum BudgetOutcome
{
    Done,

    /// <summary>No such expense group, category or open jar in the month's currency of the person's.</summary>
    NotFound,

    /// <summary>The change makes a level hold more than it may (<see cref="BudgetResult.Overflow"/> says which).</summary>
    Overflow,

    /// <summary>The month is planned already (starting it again would lose its amounts).</summary>
    AlreadyPlanned,

    /// <summary>The month has no plan to delete.</summary>
    NotPlanned,
}

public sealed record BudgetResult(BudgetOutcome Outcome, BudgetOverflow? Overflow = null)
{
    public static readonly BudgetResult Done = new(BudgetOutcome.Done);
}

/// <summary>
/// The person's monthly budget (F-033): personal (no family budget), expense groups and categories only, and the jars' plan (F-034). Implemented
/// with EF Core in Infrastructure.
/// </summary>
public interface IBudgetService
{
    Task<MonthBudget> MonthAsync(Guid userId, DateOnly month, CancellationToken cancellationToken);

    Task<BudgetResult> StartAsync(Guid userId, DateOnly month, bool copyLast, CancellationToken cancellationToken);

    /// <summary>Deletes the month's plan: its total, group and category budgets (owner's review of PR #115).</summary>
    Task<BudgetResult> DeleteAsync(Guid userId, DateOnly month, CancellationToken cancellationToken);

    Task<BudgetResult> SetTotalAsync(Guid userId, DateOnly month, decimal? amount, CancellationToken cancellationToken);

    Task<BudgetResult> SetGroupAsync(
        Guid userId, DateOnly month, Guid groupId, decimal? amount, CancellationToken cancellationToken);

    Task<BudgetResult> SetCategoryAsync(
        Guid userId, DateOnly month, Guid categoryId, decimal? amount, CancellationToken cancellationToken);

    /// <summary>What the month plans for an open jar in its currency (F-034); within the total.</summary>
    Task<BudgetResult> SetJarAsync(
        Guid userId, DateOnly month, Guid jarId, decimal? amount, CancellationToken cancellationToken);
}
