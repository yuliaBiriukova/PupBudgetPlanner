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
/// An invite link the admin made for one person (F-028). It lets one account be created, within
/// <see cref="Lifetime"/>, unless the admin cancels it first. Only the hash of the link's token is kept.
/// </summary>
public sealed class Invitation
{
    public const int NoteMaxLength = 60;

    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    public Guid Id { get; init; }

    /// <summary>SHA-256 of the token in the link; the token itself is shown once, when the link is made.</summary>
    public required byte[] TokenHash { get; init; }

    /// <summary>Who the link is for, as the admin wrote it. Only the admin sees it.</summary>
    public string? Note { get; init; }

    /// <summary>The admin who made it; empty once that account is gone.</summary>
    public Guid? CreatedById { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset ExpiresAt { get; init; }

    /// <summary>The account created with it; empty once that account is deleted (the invitation stays used).</summary>
    public Guid? UsedById { get; private set; }

    public DateTimeOffset? UsedAt { get; private set; }

    public DateTimeOffset? CancelledAt { get; private set; }

    public static Invitation Create(byte[] tokenHash, string? note, Guid createdById, DateTimeOffset now) => new()
    {
        Id = Guid.CreateVersion7(now),
        TokenHash = tokenHash,
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
        CreatedById = createdById,
        CreatedAt = now,
        ExpiresAt = now + Lifetime,
    };

    public InvitationStatus StatusAt(DateTimeOffset now) =>
        UsedAt is not null ? InvitationStatus.Used
        : CancelledAt is not null ? InvitationStatus.Cancelled
        : now >= ExpiresAt ? InvitationStatus.Expired
        : InvitationStatus.Waiting;

    // Using it happens in one conditional UPDATE in the account's transaction (AccountCreator), so two sign-ups
    // racing for one link can't both win; the condition there is "waiting" as defined by StatusAt.

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
