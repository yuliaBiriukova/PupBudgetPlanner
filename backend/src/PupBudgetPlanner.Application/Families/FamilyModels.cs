namespace PupBudgetPlanner.Application.Families;

/// <summary>
/// The signed-in person's family (F-023): its name, everyone in it and, for the owner only, the links still waiting
/// to be opened.
/// </summary>
public sealed record FamilyView(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    bool IsOwner,
    IReadOnlyList<FamilyMemberItem> Members,
    IReadOnlyList<FamilyInvitationItem> Invitations);

/// <summary>
/// One person in the family. <paramref name="StartedFamily"/> is true for the one who started it ("Started the family
/// …" rather than "Joined …").
/// </summary>
public sealed record FamilyMemberItem(
    Guid Id,
    string DisplayName,
    bool IsOwner,
    bool IsYou,
    bool StartedFamily,
    DateTimeOffset JoinedAt);

/// <summary>A family's link waiting to be opened; <paramref name="Note"/> says who it is for.</summary>
public sealed record FamilyInvitationItem(Guid Id, string? Note, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);

public sealed record StartFamilyRequest(string Name);

public sealed record RenameFamilyRequest(string Name);

/// <summary>An owner who leaves others behind names who looks after the family next.</summary>
public sealed record LeaveFamilyRequest(Guid? NewOwnerId);

/// <summary>Join the family of the invite link with this token.</summary>
public sealed record JoinFamilyRequest(string Token);

public enum FamilyActionOutcome
{
    Done,

    /// <summary>The person isn't in a family.</summary>
    NoFamily,

    /// <summary>The person is in a family already (this one or another): one at a time.</summary>
    AlreadyInFamily,

    /// <summary>Only the family's owner may do this.</summary>
    NotOwner,

    /// <summary>No such member or link in the family.</summary>
    NotFound,

    /// <summary>The link was already used, cancelled or expired.</summary>
    NotWaiting,

    /// <summary>The owner can't remove themselves; they leave instead.</summary>
    IsOwner,

    /// <summary>The owner leaves others behind and named nobody (or nobody in the family) to look after it.</summary>
    NewOwnerNeeded,

    /// <summary>The invite link was used, expired, cancelled, made up or isn't a family's; never told apart.</summary>
    InvitationGone,
}
