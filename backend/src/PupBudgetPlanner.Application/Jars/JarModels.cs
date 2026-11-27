using PupBudgetPlanner.Domain.Jars;

namespace PupBudgetPlanner.Application.Jars;

/// <summary>
/// A jar's money on one account (F-034): <paramref name="Amount"/> in the jar's currency, <paramref name="AccountAmount"/>
/// in the account's.
/// </summary>
public sealed record JarPlaceItem(
    Guid AccountId, string AccountName, string AccountCurrency, decimal Amount, decimal AccountAmount);

/// <summary>
/// One line of a jar's history, newest first: <paramref name="Amount"/> in the jar's currency (negative out), and
/// what it was on the account in its own currency. <paramref name="OtherJarName"/> for a move between jars,
/// <paramref name="Month"/> (<c>yyyy-MM</c>) for a month's saved money.
/// </summary>
public sealed record JarMoveItem(
    Guid Id,
    DateOnly Date,
    JarMoveKind Kind,
    decimal Amount,
    Guid AccountId,
    string AccountName,
    string AccountCurrency,
    decimal AccountAmount,
    Guid? OtherJarId,
    string? OtherJarName,
    string? Month);

/// <summary>
/// A jar on the Jars page (F-034). <paramref name="By"/> is the target month, <c>yyyy-MM</c>. <paramref name="Saved"/>
/// is what is in it, in its currency. <paramref name="PlannedThisMonth"/> is what this month's budget plans for it
/// (none when it isn't in the plan) and <paramref name="SetAsideThisMonth"/> what went in this month, less what came out.
/// </summary>
public sealed record JarItem(
    Guid Id,
    string Name,
    JarIcon Icon,
    JarColor Color,
    string Currency,
    decimal? Goal,
    string? By,
    string? Note,
    decimal Saved,
    IReadOnlyList<JarPlaceItem> Places,
    IReadOnlyList<JarMoveItem> History,
    decimal? PlannedThisMonth,
    decimal SetAsideThisMonth,
    DateTimeOffset? ClosedAt);

/// <summary>A new jar or the edited one; <paramref name="By"/> written <c>yyyy-MM</c>.</summary>
public sealed record SaveJarRequest(
    string Name,
    JarIcon Icon,
    JarColor Color,
    string Currency,
    decimal? Goal,
    string? By,
    string? Note);

public enum JarMoveAction
{
    /// <summary>Set money aside from an account: <see cref="JarMoveRequest.Amount"/> in the account's currency.</summary>
    In,

    /// <summary>Give it back to the account it lies on: the amount in the jar's currency.</summary>
    Out,

    /// <summary>Into another jar of the same currency, the money staying on its account: the amount in the jar's.</summary>
    Move,
}

/// <summary>
/// Money into a jar, out of it, or to another jar (<paramref name="ToJarId"/>). Putting in from an account in another
/// currency converts at today's NBU rate.
/// </summary>
public sealed record JarMoveRequest(JarMoveAction Action, Guid AccountId, decimal Amount, Guid? ToJarId);

/// <summary>Which of the month's two kinds of saved money is split (F-034).</summary>
public enum SavedMoneyWay
{
    /// <summary>What's left of the month's budgets.</summary>
    LeftOfBudgets,

    /// <summary>The month's income minus its expenses.</summary>
    Net,
}

/// <summary>One jar's part of the split: from which account, how much (in the jar's currency, the account's too).</summary>
public sealed record SavedMoneyPart(Guid JarId, Guid AccountId, decimal Amount);

/// <summary>
/// <paramref name="Month"/>'s (<c>yyyy-MM</c>) saved money split across jars; what isn't given out stays free. Together
/// the parts and what went in from that month's saved money before may not be more than <paramref name="Way"/>'s amount.
/// </summary>
public sealed record SavedMoneyRequest(string Month, SavedMoneyWay Way, IReadOnlyList<SavedMoneyPart> Parts);

public enum JarOutcome
{
    Done,

    /// <summary>No such jar (or account, or other jar) of the person's.</summary>
    NotFound,

    /// <summary>The jar is closed: nothing goes in or out any more.</summary>
    Closed,

    /// <summary>A new currency for a jar with money in it.</summary>
    CurrencyFixed,

    /// <summary>More taken out (or moved) than the jar has on that account.</summary>
    NotEnough,

    /// <summary>No NBU rate today for the account's currency and the jar's.</summary>
    NoRate,

    /// <summary>The other jar is this one, or in another currency.</summary>
    OtherJar,

    /// <summary>The split gives out more than the month's saved money.</summary>
    TooMuch,

    /// <summary>The split's account isn't in the jar's currency.</summary>
    WrongCurrency,
}

/// <summary>What a change to a jar came to; <paramref name="Jar"/> is set when it was saved.</summary>
public sealed record JarResult(JarOutcome Outcome, JarItem? Jar = null)
{
    public static readonly JarResult Done = new(JarOutcome.Done);
}

/// <summary>The person's saving jars (F-034): personal, implemented with EF Core in Infrastructure.</summary>
public interface IJarService
{
    /// <summary>The open jars, oldest first, with their money and history.</summary>
    Task<IReadOnlyList<JarItem>> ListAsync(Guid userId, CancellationToken cancellationToken);

    Task<JarResult> CreateAsync(Guid userId, SaveJarRequest request, CancellationToken cancellationToken);

    /// <summary>Its currency stays once money has gone in.</summary>
    Task<JarResult> UpdateAsync(Guid userId, Guid jarId, SaveJarRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Closes the jar: it leaves the list, its history stays, its money becomes free; this month's and later plans for
    /// it go.
    /// </summary>
    Task<JarResult> CloseAsync(Guid userId, Guid jarId, CancellationToken cancellationToken);

    Task<JarResult> MoveAsync(Guid userId, Guid jarId, JarMoveRequest request, CancellationToken cancellationToken);

    /// <summary>A month's saved money into jars, from the Budget page.</summary>
    Task<JarResult> PutSavedMoneyAsync(Guid userId, SavedMoneyRequest request, CancellationToken cancellationToken);
}
