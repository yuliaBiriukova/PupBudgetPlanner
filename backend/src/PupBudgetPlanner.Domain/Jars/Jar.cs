namespace PupBudgetPlanner.Domain.Jars;

/// <summary>The picture on a jar (F-034): one of Tabler's icons, no paw or dog images.</summary>
public enum JarIcon
{
    Car,
    Home,
    Plane,
    Beach,
    Device,
    Coins,
    Gift,
    School,
}

/// <summary>A jar's colour: one of Mantine's palette colours from the theme, true in both schemes (F-034).</summary>
public enum JarColor
{
    Blue,
    Teal,
    Orange,
    Yellow,
    Pink,
    Gray,
}

/// <summary>What a person writes about a jar: everything but its money.</summary>
public sealed record JarDetails(
    string Name,
    JarIcon Icon,
    JarColor Color,
    string Currency,
    decimal? Goal,
    DateOnly? TargetMonth,
    string? Note);

/// <summary>
/// A saving jar (F-034, ADR 0038): a goal (a car, an apartment) that sets money aside inside the person's real
/// accounts. The money stays where it lies; the jar only says how much of it is meant for the goal. One currency per
/// jar; personal. Closed when the goal is used or given up: it leaves the list, its history stays, its money is free.
/// </summary>
public sealed class Jar
{
    public const int NameMaxLength = 40;

    public const int NoteMaxLength = 200;

    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public string Name { get; private set; } = string.Empty;

    public JarIcon Icon { get; private set; }

    public JarColor Color { get; private set; }

    /// <summary>ISO 4217 code; fixed once money has gone in.</summary>
    public string Currency { get; private set; } = string.Empty;

    /// <summary>The amount saved for, whole (ADR 0018); none for a jar without a goal.</summary>
    public decimal? Goal { get; private set; }

    /// <summary>The month the goal is meant for, as its first day; none without a date.</summary>
    public DateOnly? TargetMonth { get; private set; }

    public string? Note { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset? ClosedAt { get; private set; }

    public bool IsClosed => ClosedAt is not null;

    public static Jar Create(Guid userId, JarDetails details, DateTimeOffset now)
    {
        var jar = new Jar { Id = Guid.CreateVersion7(), UserId = userId, CreatedAt = now };
        jar.Update(details);
        return jar;
    }

    public void Update(JarDetails details)
    {
        Name = details.Name.Trim();
        Icon = details.Icon;
        Color = details.Color;
        Currency = details.Currency;
        Goal = details.Goal is { } goal ? Money.Whole(goal) : null;
        TargetMonth = details.TargetMonth is { } month ? new DateOnly(month.Year, month.Month, 1) : null;
        Note = string.IsNullOrWhiteSpace(details.Note) ? null : details.Note.Trim();
    }

    public void Close(DateTimeOffset now) => ClosedAt ??= now;
}
