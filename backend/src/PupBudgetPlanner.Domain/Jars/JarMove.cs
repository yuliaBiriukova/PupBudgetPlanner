namespace PupBudgetPlanner.Domain.Jars;

/// <summary>Why money went into a jar or out of it (F-034): the jar's history names each.</summary>
public enum JarMoveKind
{
    /// <summary>Set aside from an account.</summary>
    PutIn,

    /// <summary>Given back to the account, free again.</summary>
    TakeOut,

    /// <summary>Came from another jar (<see cref="JarMove.OtherJarId"/>), staying on its account.</summary>
    MovedIn,

    /// <summary>Went to another jar (<see cref="JarMove.OtherJarId"/>), staying on its account.</summary>
    MovedOut,

    /// <summary>Part of a month's saved money (<see cref="JarMove.Month"/>), from the Budget page.</summary>
    SavedMoney,
}

/// <summary>
/// Money set aside into a jar (a positive <see cref="Amount"/>) or taken out of it (negative), on one of the jar
/// owner's accounts (F-034). Neither income nor expense: the account's balance doesn't change, only how much of it is
/// free. <see cref="Amount"/> is in the jar's currency, <see cref="AccountAmount"/> in the account's: the same number
/// when they match, otherwise converted at the NBU rate of the day it went in (Q-014, 1). Whole amounts (ADR 0018).
/// </summary>
public sealed class JarMove
{
    public Guid Id { get; init; }

    public Guid JarId { get; init; }

    public Guid AccountId { get; init; }

    /// <summary>The day, Kyiv's.</summary>
    public DateOnly Date { get; init; }

    public JarMoveKind Kind { get; init; }

    public decimal Amount { get; init; }

    public decimal AccountAmount { get; init; }

    /// <summary>The jar money came from or went to, for <see cref="JarMoveKind.MovedIn"/> and <see cref="JarMoveKind.MovedOut"/>.</summary>
    public Guid? OtherJarId { get; init; }

    /// <summary>The month whose saved money it was (its first day), for <see cref="JarMoveKind.SavedMoney"/>.</summary>
    public DateOnly? Month { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public static JarMove Of(
        Guid jarId,
        Guid accountId,
        DateOnly date,
        JarMoveKind kind,
        decimal amount,
        decimal accountAmount,
        DateTimeOffset now,
        Guid? otherJarId = null,
        DateOnly? month = null) =>
        new()
        {
            Id = Guid.CreateVersion7(),
            JarId = jarId,
            AccountId = accountId,
            Date = date,
            Kind = kind,
            Amount = Money.Whole(amount),
            AccountAmount = Money.Whole(accountAmount),
            OtherJarId = otherJarId,
            Month = month,
            CreatedAt = now,
        };
}
