using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Access;

/// <summary>
/// Listing, cancelling and deleting links, shared by the admin's Invite links tab and a family owner's Family page
/// (I-006). The caller narrows <c>links</c> to what the person may touch: every link, or their family's.
/// </summary>
internal static class InvitationLinks
{
    /// <summary>The links <paramref name="filter"/> picks, newest first, with who used them and the family they join.</summary>
    public static async Task<IReadOnlyList<InvitationItem>> ListAsync(
        AppDbContext dbContext,
        Expression<Func<Invitation, bool>> filter,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var rows = await (
                from invitation in dbContext.Invitations.AsNoTracking().Where(filter)
                join user in dbContext.Users on invitation.UsedById equals user.Id into used
                from usedBy in used.DefaultIfEmpty()
                join family in dbContext.Families on invitation.FamilyId equals family.Id into families
                from forFamily in families.DefaultIfEmpty()
                orderby invitation.CreatedAt descending
                select new
                {
                    invitation,
                    UsedByName = usedBy == null ? null : usedBy.DisplayName,
                    FamilyName = forFamily == null ? null : forFamily.Name,
                })
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
                row.invitation.CancelledAt,
                row.FamilyName))
            .ToList();
    }

    /// <summary>
    /// Cancels the picked links among <paramref name="links"/> that are still waiting, in one UPDATE: a link used at the
    /// same moment stays used ("waiting" as <see cref="Invitation.StatusAt"/> defines it).
    /// </summary>
    public static async Task<InvitationsChanged> CancelAsync(
        IQueryable<Invitation> links, InvitationsRequest request, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        var cancelled = await links
            .Where(i => ids.Contains(i.Id) && i.UsedAt == null && i.CancelledAt == null && i.ExpiresAt > now)
            .ExecuteUpdateAsync(set => set.SetProperty(i => i.CancelledAt, now), cancellationToken);
        return new InvitationsChanged(cancelled);
    }

    /// <summary>
    /// Deletes the picked links among <paramref name="links"/>, of any status, in one DELETE. Links already gone don't
    /// count. The accounts made with them keep "Invited" and its note (copied onto the account), and families stay.
    /// </summary>
    public static async Task<InvitationsChanged> DeleteAsync(
        IQueryable<Invitation> links, InvitationsRequest request, CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        var deleted = await links.Where(i => ids.Contains(i.Id)).ExecuteDeleteAsync(cancellationToken);
        return new InvitationsChanged(deleted);
    }
}
