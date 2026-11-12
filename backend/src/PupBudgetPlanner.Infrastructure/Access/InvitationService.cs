using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Access;

internal sealed class InvitationService(AppDbContext dbContext, TimeProvider clock) : IInvitationService
{
    public async Task<CreatedInvitation> CreateAsync(
        Guid adminId, CreateInvitationRequest request, CancellationToken cancellationToken)
    {
        var token = InvitationToken.New();
        var invitation = Invitation.Create(InvitationToken.Hash(token), request.Note, adminId, clock.GetUtcNow());

        dbContext.Invitations.Add(invitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreatedInvitation(invitation.Id, token, invitation.Note, invitation.ExpiresAt);
    }

    public Task<IReadOnlyList<InvitationItem>> ListAsync(CancellationToken cancellationToken) =>
        InvitationLinks.ListAsync(dbContext, _ => true, clock.GetUtcNow(), cancellationToken);

    public Task<InvitationsChanged> CancelManyAsync(InvitationsRequest request, CancellationToken cancellationToken) =>
        InvitationLinks.CancelAsync(dbContext.Invitations, request, clock.GetUtcNow(), cancellationToken);

    public Task<InvitationsChanged> DeleteAsync(InvitationsRequest request, CancellationToken cancellationToken) =>
        InvitationLinks.DeleteAsync(dbContext.Invitations, request, cancellationToken);

    public async Task<CancelInvitationOutcome> CancelAsync(Guid id, CancellationToken cancellationToken)
    {
        var invitation = await dbContext.Invitations.FindAsync([id], cancellationToken);
        if (invitation is null)
        {
            return CancelInvitationOutcome.NotFound;
        }

        if (!invitation.Cancel(clock.GetUtcNow()))
        {
            return CancelInvitationOutcome.NotWaiting;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return CancelInvitationOutcome.Cancelled;
    }

    public async Task<InvitationPreview?> PreviewAsync(string token, CancellationToken cancellationToken)
    {
        var hash = InvitationToken.Hash(token);
        var now = clock.GetUtcNow();
        var found = await (
                from invitation in dbContext.Invitations.AsNoTracking()
                join admin in dbContext.Users on invitation.CreatedById equals admin.Id into creators
                from createdBy in creators.DefaultIfEmpty()
                where invitation.TokenHash == hash
                select new { invitation, InviterName = createdBy == null ? null : createdBy.DisplayName })
            .SingleOrDefaultAsync(cancellationToken);

        if (found is null || found.invitation.StatusAt(now) != InvitationStatus.Waiting)
        {
            return null;
        }

        var family = found.invitation.FamilyId is { } familyId
            ? await InvitedFamilyAsync(familyId, cancellationToken)
            : null;
        return new InvitationPreview(found.InviterName ?? "Pup Budget", found.invitation.ExpiresAt, family);
    }

    /// <summary>The family a link joins, for whoever holds the link: its name and its people's names (F-023).</summary>
    private async Task<InvitedFamily?> InvitedFamilyAsync(Guid familyId, CancellationToken cancellationToken)
    {
        var family = await dbContext.Families.AsNoTracking()
            .Include(f => f.Members)
            .SingleOrDefaultAsync(f => f.Id == familyId, cancellationToken);
        if (family is null)
        {
            return null;
        }

        var memberIds = family.Members.Select(m => m.UserId).ToList();
        var names = await dbContext.Users.AsNoTracking()
            .Where(user => memberIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, user => user.DisplayName, cancellationToken);
        var members = family.Members
            .OrderByDescending(m => family.IsOwner(m.UserId))
            .ThenBy(m => m.JoinedAt)
            .Select(m => new InvitedFamilyMember(names.GetValueOrDefault(m.UserId, string.Empty), family.IsOwner(m.UserId)))
            .ToList();
        return new InvitedFamily(family.Id, family.Name, members);
    }
}
