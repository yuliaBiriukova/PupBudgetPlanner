using PupBudgetPlanner.Domain.Invitations;

namespace PupBudgetPlanner.Application.Access;

/// <summary>Whether creating an account needs an invite link (F-028).</summary>
public sealed record SignUpInfo(SignUpMode Mode);

/// <summary>A new invite link; <paramref name="Note"/> says who it is for and only the admin sees it.</summary>
public sealed record CreateInvitationRequest(string? Note);

/// <summary>
/// The link just made. <paramref name="Token"/> goes into <c>/invite/{token}</c>; it is never shown again, because
/// only its hash is stored.
/// </summary>
public sealed record CreatedInvitation(Guid Id, string Token, string? Note, DateTimeOffset ExpiresAt);

/// <summary>
/// One invite link on the admin's list. <paramref name="FamilyName"/> is set for a family's link (F-023, open point 5).
/// </summary>
public sealed record InvitationItem(
    Guid Id,
    string? Note,
    InvitationStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    DateTimeOffset? UsedAt,
    string? UsedByName,
    DateTimeOffset? CancelledAt,
    string? FamilyName = null);

/// <summary>
/// What the invite page shows about a link that works: who invited and until when, and for a family's link the family
/// it joins (F-023).
/// </summary>
public sealed record InvitationPreview(string InviterName, DateTimeOffset ExpiresAt, InvitedFamily? Family = null);

/// <summary>The family a link joins: its name and who is in it, the owner first.</summary>
public sealed record InvitedFamily(Guid Id, string Name, IReadOnlyList<InvitedFamilyMember> Members);

public sealed record InvitedFamilyMember(string DisplayName, bool IsOwner);

/// <summary>
/// One person on the People page. How they sign in is left out on purpose: the admin doesn't need it (F-028,
/// decision 7).
/// </summary>
public sealed record PersonItem(
    Guid Id,
    string DisplayName,
    string Email,
    DateTimeOffset JoinedAt,
    bool IsAdmin,
    bool IsYou,
    bool Invited,
    string? InvitationNote,
    DateTimeOffset? BlockedAt);

/// <summary>The people an admin action is for: one from a row's menu, or everyone picked.</summary>
public sealed record PeopleRequest(IReadOnlyList<Guid> UserIds);

public enum PeopleActionOutcome
{
    Done,

    /// <summary>The admin picked themselves; nothing was changed.</summary>
    IncludesYou,

    /// <summary>One of the ids is not an account (any more); nothing was changed.</summary>
    NotFound,
}

public enum CancelInvitationOutcome
{
    Cancelled,
    NotFound,

    /// <summary>It was already used, expired or cancelled.</summary>
    NotWaiting,
}
