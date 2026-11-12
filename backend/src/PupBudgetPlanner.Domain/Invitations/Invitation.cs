using System.Linq.Expressions;

namespace PupBudgetPlanner.Domain.Invitations;

/// <summary>Where an invitation is in its life. Worked out from its dates, never stored (F-028).</summary>
public enum InvitationStatus
{
    Waiting,
    Used,
    Expired,
    Cancelled,
}

/// <summary>
/// An invite link for one person, made by the admin (F-028) or by a family's owner (F-023). It works once, within
/// <see cref="Lifetime"/>, unless it is cancelled first: it lets an account be created, and a family's link also takes
/// that person, new or not, into the family. Only the hash of the link's token is kept.
/// </summary>
public sealed class Invitation
{
    public const int NoteMaxLength = 60;

    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    public Guid Id { get; init; }

    /// <summary>SHA-256 of the token in the link; the token itself is shown once, when the link is made.</summary>
    public required byte[] TokenHash { get; init; }

    /// <summary>Who the link is for, as its maker wrote it. Only they (and the admin) see it.</summary>
    public string? Note { get; init; }

    /// <summary>The admin or family owner who made it; empty once that account is gone.</summary>
    public Guid? CreatedById { get; init; }

    /// <summary>
    /// The family the link takes its person into (F-023); empty for the admin's links, and once the family is deleted
    /// (its waiting links are cancelled first).
    /// </summary>
    public Guid? FamilyId { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset ExpiresAt { get; init; }

    /// <summary>The account created with it; empty once that account is deleted (the invitation stays used).</summary>
    public Guid? UsedById { get; private set; }

    public DateTimeOffset? UsedAt { get; private set; }

    public DateTimeOffset? CancelledAt { get; private set; }

    /// <summary>
    /// Whether the account was created with it ("Invited" on the People page). A family's link opened by someone who
    /// already has an account is used without creating one (F-023).
    /// </summary>
    public bool CreatedAccount { get; private set; }

    /// <summary>A new link; with <paramref name="familyId"/> it is a family's link, made by its owner.</summary>
    public static Invitation Create(
        byte[] tokenHash, string? note, Guid createdById, DateTimeOffset now, Guid? familyId = null) => new()
    {
        Id = Guid.CreateVersion7(now),
        TokenHash = tokenHash,
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
        CreatedById = createdById,
        FamilyId = familyId,
        CreatedAt = now,
        ExpiresAt = now + Lifetime,
    };

    public InvitationStatus StatusAt(DateTimeOffset now) =>
        UsedAt is not null ? InvitationStatus.Used
        : CancelledAt is not null ? InvitationStatus.Cancelled
        : now >= ExpiresAt ? InvitationStatus.Expired
        : InvitationStatus.Waiting;

    /// <summary>
    /// When it stopped working: used, cancelled or expired; null while it is waiting. The morning clean-up deletes it
    /// a while after this (I-006).
    /// </summary>
    public DateTimeOffset? StoppedAt(DateTimeOffset now) => StatusAt(now) switch
    {
        InvitationStatus.Used => UsedAt,
        InvitationStatus.Cancelled => CancelledAt,
        InvitationStatus.Expired => ExpiresAt,
        _ => null,
    };

    /// <summary>
    /// Links that stopped working before <paramref name="cutoff"/>, as a query the database runs (I-006): the date of
    /// <see cref="StoppedAt"/>. A link is used or cancelled only while it waits, before it expires, so the first of
    /// the three dates that is set is the one; a waiting link's expiry is later than any cutoff in the past.
    /// </summary>
    public static Expression<Func<Invitation, bool>> StoppedBefore(DateTimeOffset cutoff) =>
        i => (i.UsedAt ?? i.CancelledAt ?? i.ExpiresAt) < cutoff;

    // Using it happens in one conditional UPDATE in the account's or the joining's transaction (AccountCreator,
    // FamilyService), so two people racing for one link can't both win; the condition there is "waiting" as defined by
    // StatusAt.

    /// <summary>Stops a waiting invitation from working. Used or expired ones stay as they are.</summary>
    public bool Cancel(DateTimeOffset now)
    {
        if (StatusAt(now) != InvitationStatus.Waiting)
        {
            return false;
        }

        CancelledAt = now;
        return true;
    }
}
