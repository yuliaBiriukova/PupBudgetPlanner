using PupBudgetPlanner.Application.Access;

namespace PupBudgetPlanner.Application.Families;

/// <summary>
/// A person's family and its invite links (F-023). The rules live in <see cref="Domain.Families.Family"/>; one family
/// per person is the database's unique index. Implemented with EF Core in Infrastructure.
/// </summary>
public interface IFamilyService
{
    /// <summary>The person's family, or null when they are in none.</summary>
    Task<FamilyView?> GetAsync(Guid userId, CancellationToken cancellationToken);

    Task<FamilyActionOutcome> StartAsync(Guid userId, StartFamilyRequest request, CancellationToken cancellationToken);

    Task<FamilyActionOutcome> RenameAsync(Guid userId, RenameFamilyRequest request, CancellationToken cancellationToken);

    /// <summary>A link for one person, for <see cref="Domain.Invitations.Invitation.Lifetime"/>; the owner only.</summary>
    Task<(FamilyActionOutcome Outcome, CreatedInvitation? Invitation)> InviteAsync(
        Guid userId, CreateInvitationRequest request, CancellationToken cancellationToken);

    Task<FamilyActionOutcome> CancelInvitationAsync(Guid userId, Guid invitationId, CancellationToken cancellationToken);

    /// <summary>The family's links of every status, newest first; the owner only (I-006).</summary>
    Task<(FamilyActionOutcome Outcome, IReadOnlyList<InvitationItem> Invitations)> InvitationsAsync(
        Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Cancels the picked links of the owner's family that are still waiting; another family's links and the ones that
    /// don't wait any more are left as they are (I-006).
    /// </summary>
    Task<(FamilyActionOutcome Outcome, InvitationsChanged Changed)> CancelInvitationsAsync(
        Guid userId, InvitationsRequest request, CancellationToken cancellationToken);

    /// <summary>Deletes the picked links of the owner's family, of any status; another family's are left (I-006).</summary>
    Task<(FamilyActionOutcome Outcome, InvitationsChanged Changed)> DeleteInvitationsAsync(
        Guid userId, InvitationsRequest request, CancellationToken cancellationToken);

    Task<FamilyActionOutcome> RemoveAsync(Guid userId, Guid memberId, CancellationToken cancellationToken);

    /// <summary>Leaves; an owner with others hands the family over, the last one to leave deletes it.</summary>
    Task<FamilyActionOutcome> LeaveAsync(Guid userId, LeaveFamilyRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Whose money <paramref name="who"/> asks for, as <paramref name="userId"/> may look at it (F-024): their own,
    /// one member's, or the family's with their own first. Null when it isn't theirs to look at: no family, or the
    /// person isn't in it.
    /// </summary>
    Task<MoneyScope?> ScopeAsync(Guid userId, Who who, CancellationToken cancellationToken);

    /// <summary>Joins the family of a waiting family link and uses the link up.</summary>
    Task<FamilyActionOutcome> JoinAsync(Guid userId, JoinFamilyRequest request, CancellationToken cancellationToken);
}
