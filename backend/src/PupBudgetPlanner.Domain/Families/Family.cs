namespace PupBudgetPlanner.Domain.Families;

/// <summary>What came of a change to a family (F-023).</summary>
public enum FamilyOutcome
{
    Done,

    /// <summary>Only the family's owner may do this.</summary>
    NotOwner,

    /// <summary>The person isn't in this family.</summary>
    NotMember,

    /// <summary>The person is already in this family.</summary>
    AlreadyMember,

    /// <summary>The owner can't remove themselves: they leave and name the next owner instead.</summary>
    IsOwner,
}

/// <summary>What came of leaving a family (F-023, open point 2).</summary>
public enum LeaveOutcome
{
    /// <summary>A member left; the family goes on as it was.</summary>
    Left,

    /// <summary>The owner left and the person they named looks after the family now.</summary>
    HandedOver,

    /// <summary>The last person left: the family has nobody in it and is to be deleted.</summary>
    Emptied,

    NotMember,

    /// <summary>The owner leaves others behind and named nobody to look after the family.</summary>
    NewOwnerNeeded,

    /// <summary>The person named to look after the family isn't in it.</summary>
    NoSuchNewOwner,
}

/// <summary>
/// People who see each other's money (F-023). A person is in one family at most (the database's unique index on
/// <see cref="FamilyMember.UserId"/>). The owner names, renames and invites; everyone can leave, and nothing of anyone's
/// is deleted when they do.
/// </summary>
public sealed class Family
{
    public const int NameMaxLength = 40;

    public Guid Id { get; init; }

    /// <summary>Everyone in the family sees it, for example their surname.</summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>The one who invites and removes people and renames the family.</summary>
    public Guid OwnerId { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>Everyone in the family, the owner too.</summary>
    public ICollection<FamilyMember> Members { get; } = [];

    /// <summary>A new family with <paramref name="ownerId"/> as its owner and only member.</summary>
    public static Family Start(Guid ownerId, string name, DateTimeOffset now)
    {
        var family = new Family { Id = Guid.CreateVersion7(now), Name = name.Trim(), OwnerId = ownerId, CreatedAt = now };
        family.Members.Add(new FamilyMember { FamilyId = family.Id, UserId = ownerId, JoinedAt = now });
        return family;
    }

    public bool IsOwner(Guid userId) => OwnerId == userId;

    public bool Has(Guid userId) => Members.Any(member => member.UserId == userId);

    /// <summary>Whether <paramref name="userId"/> started the family (rather than joined it later).</summary>
    public bool StartedBy(Guid userId) => Members.Any(member => member.UserId == userId && member.JoinedAt == CreatedAt);

    public FamilyOutcome Rename(Guid byUserId, string name)
    {
        if (!IsOwner(byUserId))
        {
            return FamilyOutcome.NotOwner;
        }

        Name = name.Trim();
        return FamilyOutcome.Done;
    }

    /// <summary>
    /// Adds the person who opened the family's link. Whether they are in another family is the database's to say: the
    /// family can't see the others.
    /// </summary>
    public FamilyOutcome Join(Guid userId, DateTimeOffset now)
    {
        if (Has(userId))
        {
            return FamilyOutcome.AlreadyMember;
        }

        Members.Add(new FamilyMember { FamilyId = Id, UserId = userId, JoinedAt = now });
        return FamilyOutcome.Done;
    }

    /// <summary>The owner takes someone out of the family; their money stays theirs (open point 6).</summary>
    public FamilyOutcome Remove(Guid byUserId, Guid memberId)
    {
        if (!IsOwner(byUserId))
        {
            return FamilyOutcome.NotOwner;
        }

        if (memberId == byUserId)
        {
            return FamilyOutcome.IsOwner;
        }

        var member = Members.FirstOrDefault(m => m.UserId == memberId);
        if (member is null)
        {
            return FamilyOutcome.NotMember;
        }

        Members.Remove(member);
        return FamilyOutcome.Done;
    }

    /// <summary>
    /// Takes <paramref name="userId"/> out of the family. An owner who leaves others behind names who looks after it
    /// next (<paramref name="newOwnerId"/>); the last one to leave empties it.
    /// </summary>
    public LeaveOutcome Leave(Guid userId, Guid? newOwnerId)
    {
        var member = Members.FirstOrDefault(m => m.UserId == userId);
        if (member is null)
        {
            return LeaveOutcome.NotMember;
        }

        var others = Members.Where(m => m.UserId != userId).ToList();
        if (others.Count == 0)
        {
            Members.Remove(member);
            return LeaveOutcome.Emptied;
        }

        if (!IsOwner(userId))
        {
            Members.Remove(member);
            return LeaveOutcome.Left;
        }

        if (newOwnerId is null)
        {
            return LeaveOutcome.NewOwnerNeeded;
        }

        if (others.All(m => m.UserId != newOwnerId))
        {
            return LeaveOutcome.NoSuchNewOwner;
        }

        OwnerId = newOwnerId.Value;
        Members.Remove(member);
        return LeaveOutcome.HandedOver;
    }

    /// <summary>
    /// Takes out people whose accounts are being deleted. When the owner is one of them, whoever has been in the family
    /// longest looks after it. Returns whether anyone is left.
    /// </summary>
    public bool Lose(IReadOnlyCollection<Guid> userIds)
    {
        foreach (var member in Members.Where(m => userIds.Contains(m.UserId)).ToList())
        {
            Members.Remove(member);
        }

        var next = Members.OrderBy(m => m.JoinedAt).FirstOrDefault();
        if (next is not null && userIds.Contains(OwnerId))
        {
            OwnerId = next.UserId;
        }

        return next is not null;
    }
}

/// <summary>One person in a family (F-023).</summary>
public sealed class FamilyMember
{
    public Guid FamilyId { get; init; }

    public Guid UserId { get; init; }

    public DateTimeOffset JoinedAt { get; init; }
}
