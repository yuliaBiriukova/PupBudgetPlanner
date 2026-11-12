using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Application.Families;

/// <summary>
/// The signed-in person's family (F-023): its name and everyone in it. The owner's invite links come on their own, from
/// <c>GET /api/family/invitations</c> (I-006).
/// </summary>
public sealed record FamilyView(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    bool IsOwner,
    IReadOnlyList<FamilyMemberItem> Members);

/// <summary>
/// One person in the family. <paramref name="StartedFamily"/> is true for the one who started it ("Started the family
/// …" rather than "Joined …"). <paramref name="Transactions"/> is what they share of their transactions and
/// <paramref name="KeepsPrivate"/> whether they keep anything from the others (F-030): the family views say so.
/// </summary>
public sealed record FamilyMemberItem(
    Guid Id,
    string DisplayName,
    bool IsOwner,
    bool IsYou,
    bool StartedFamily,
    DateTimeOffset JoinedAt,
    TransactionShare Transactions,
    bool KeepsPrivate);

public sealed record StartFamilyRequest(string Name);

public sealed record RenameFamilyRequest(string Name);

/// <summary>An owner who leaves others behind names who looks after the family next.</summary>
public sealed record LeaveFamilyRequest(Guid? NewOwnerId);

/// <summary>Join the family of the invite link with this token.</summary>
public sealed record JoinFamilyRequest(string Token);

/// <summary>What the family sees of all your transactions (F-030).</summary>
public sealed record ShareTransactionsRequest(TransactionShare Share);

/// <summary>What the family sees of one of your accounts (F-030).</summary>
public sealed record ShareAccountRequest(AccountShare Share);

/// <summary>Whether the family sees nothing of one of your categories, or of a whole group (F-030).</summary>
public sealed record KeepCategoryRequest(bool IsPrivate);

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
