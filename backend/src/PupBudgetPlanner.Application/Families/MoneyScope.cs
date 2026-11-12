namespace PupBudgetPlanner.Application.Families;

/// <summary>
/// Whose money a page shows (F-024): <paramref name="People"/>'s, as <paramref name="ViewerId"/> sees it, in the
/// viewer's report currency. Your own, one family member's, or the whole family's with your own first. Only to look at:
/// each person changes only their own, so the services that save take the signed-in person, never a scope.
/// </summary>
public sealed record MoneyScope(Guid ViewerId, IReadOnlyList<Guid> People)
{
    /// <summary>The signed-in person's own money, as every page showed it before F-024.</summary>
    public static MoneyScope Own(Guid userId) => new(userId, [userId]);

    /// <summary>More than one person's money together: their categories of one group and name count as one.</summary>
    public bool IsTogether => People.Count > 1;

    /// <summary>Equal when the viewer and the people, in their order, are.</summary>
    public bool Equals(MoneyScope? other) =>
        other is not null && ViewerId == other.ViewerId && People.SequenceEqual(other.People);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(ViewerId);
        foreach (var person in People)
        {
            hash.Add(person);
        }

        return hash.ToHashCode();
    }
}

/// <summary>
/// The <c>who</c> a page asks for (F-024): <c>me</c> (or nothing), <c>family</c>, or a family member's id.
/// <paramref name="PersonId"/> is the member's; neither it nor <paramref name="IsFamily"/> means your own.
/// </summary>
public sealed record Who(Guid? PersonId, bool IsFamily)
{
    public const string MeText = "me";

    public const string FamilyText = "family";

    public static Who Me { get; } = new(null, false);

    public static Who Family { get; } = new(null, true);

    public static Who Person(Guid personId) => new(personId, false);

    /// <summary>Your own: nothing to look up.</summary>
    public bool IsMe => PersonId is null && !IsFamily;

    /// <summary>Reads <paramref name="text"/>; false when it is none of <c>me</c>, <c>family</c> or an id.</summary>
    public static bool TryParse(string? text, out Who who)
    {
        var trimmed = text?.Trim();
        if (string.IsNullOrEmpty(trimmed) || string.Equals(trimmed, MeText, StringComparison.OrdinalIgnoreCase))
        {
            who = Me;
            return true;
        }

        if (string.Equals(trimmed, FamilyText, StringComparison.OrdinalIgnoreCase))
        {
            who = Family;
            return true;
        }

        if (Guid.TryParse(trimmed, out var id))
        {
            who = Person(id);
            return true;
        }

        who = Me;
        return false;
    }
}
