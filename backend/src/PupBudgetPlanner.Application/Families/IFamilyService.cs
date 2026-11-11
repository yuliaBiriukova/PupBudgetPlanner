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

    Task<FamilyActionOutcome> RemoveAsync(Guid userId, Guid memberId, CancellationToken cancellationToken);

    /// <summary>Leaves; an owner with others hands the family over, the last one to leave deletes it.</summary>
    Task<FamilyActionOutcome> LeaveAsync(Guid userId, LeaveFamilyRequest request, CancellationToken cancellationToken);

    /// <summary>Joins the family of a waiting family link and uses the link up.</summary>
    Task<FamilyActionOutcome> JoinAsync(Guid userId, JoinFamilyRequest request, CancellationToken cancellationToken);
}
