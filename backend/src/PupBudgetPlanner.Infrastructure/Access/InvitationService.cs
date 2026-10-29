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

    public async Task<IReadOnlyList<InvitationItem>> ListAsync(CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var rows = await (
                from invitation in dbContext.Invitations.AsNoTracking()
                join user in dbContext.Users on invitation.UsedById equals user.Id into used
                from usedBy in used.DefaultIfEmpty()
                orderby invitation.CreatedAt descending
                select new { invitation, UsedByName = usedBy == null ? null : usedBy.DisplayName })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new InvitationItem(
                row.invitation.Id,
                row.invitation.Note,
                row.invitation.StatusAt(now),
                row.invitation.CreatedAt,
                row.invitation.ExpiresAt,
                row.invitation.UsedAt,
                row.UsedByName,
                row.invitation.CancelledAt))
            .ToList();
    }

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

        return found is null || found.invitation.StatusAt(now) != InvitationStatus.Waiting
            ? null
            : new InvitationPreview(found.InviterName ?? "Pup Budget", found.invitation.ExpiresAt);
    }
}
