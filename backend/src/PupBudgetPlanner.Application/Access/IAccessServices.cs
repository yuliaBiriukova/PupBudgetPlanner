namespace PupBudgetPlanner.Application.Access;

/// <summary>Invite links (F-028). Implemented with EF Core in Infrastructure.</summary>
public interface IInvitationService
{
    /// <summary>Makes a link that works once for <see cref="Domain.Invitations.Invitation.Lifetime"/>.</summary>
    Task<CreatedInvitation> CreateAsync(Guid adminId, CreateInvitationRequest request, CancellationToken cancellationToken);

    /// <summary>All links, newest first.</summary>
    Task<IReadOnlyList<InvitationItem>> ListAsync(CancellationToken cancellationToken);

    Task<CancelInvitationOutcome> CancelAsync(Guid id, CancellationToken cancellationToken);

    /// <summary>
    /// Who invited and until when, for a link that still works; null for a used, expired, cancelled or made-up one,
    /// which are never told apart (they may be guesses).
    /// </summary>
    Task<InvitationPreview?> PreviewAsync(string token, CancellationToken cancellationToken);
}

/// <summary>Everyone with an account, and taking access away (F-028).</summary>
public interface IPeopleService
{
    /// <summary>Everyone, the admin first, then by name.</summary>
    Task<IReadOnlyList<PersonItem>> ListAsync(Guid adminId, CancellationToken cancellationToken);

    /// <summary>Signs the people out everywhere and stops them signing in; their data stays.</summary>
    Task<PeopleActionOutcome> BlockAsync(Guid adminId, PeopleRequest request, CancellationToken cancellationToken);

    Task<PeopleActionOutcome> UnblockAsync(Guid adminId, PeopleRequest request, CancellationToken cancellationToken);

    /// <summary>Deletes the accounts and everything in them, all or none.</summary>
    Task<PeopleActionOutcome> DeleteAsync(Guid adminId, PeopleRequest request, CancellationToken cancellationToken);
}
