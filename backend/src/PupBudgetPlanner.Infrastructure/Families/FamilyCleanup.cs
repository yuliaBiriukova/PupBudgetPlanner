using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Families;

/// <summary>A link just used: the family it joins, if it is a family's.</summary>
internal sealed record UsedLink(Guid? FamilyId);

/// <summary>
/// What the family service, sign-up and the admin's Delete share (F-023): using a family's link, deleting a family and
/// taking deleted accounts out of their families.
/// </summary>
internal static class FamilyCleanup
{
    /// <summary>A family's links that still work: "waiting" as <see cref="Invitation.StatusAt"/> defines it.</summary>
    public static Expression<Func<Invitation, bool>> WaitingOf(Guid familyId, DateTimeOffset now) =>
        i => i.FamilyId == familyId && i.UsedAt == null && i.CancelledAt == null && i.ExpiresAt > now;

    /// <summary>
    /// Uses up a waiting link in one conditional UPDATE, so two people racing for it can't both win, and says which
    /// family it joins; null when it doesn't work. Without <paramref name="createdAccount"/> (someone who has an account
    /// joins) only a family's link counts: the admin's links only create accounts. Call inside a transaction: rolling
    /// back leaves the link waiting.
    /// </summary>
    public static async Task<UsedLink?> UseLinkAsync(
        AppDbContext dbContext,
        byte[] tokenHash,
        Guid userId,
        DateTimeOffset now,
        bool createdAccount,
        CancellationToken cancellationToken)
    {
        var link = dbContext.Invitations.Where(i =>
            i.TokenHash == tokenHash && i.UsedAt == null && i.CancelledAt == null && i.ExpiresAt > now);
        if (!createdAccount)
        {
            link = link.Where(i => i.FamilyId != null);
        }

        var updated = await link.ExecuteUpdateAsync(
            set => set
                .SetProperty(i => i.UsedById, userId)
                .SetProperty(i => i.UsedAt, now)
                .SetProperty(i => i.CreatedAccount, createdAccount),
            cancellationToken);
        if (updated != 1)
        {
            return null;
        }

        var familyId = await dbContext.Invitations
            .Where(i => i.TokenHash == tokenHash)
            .Select(i => i.FamilyId)
            .SingleAsync(cancellationToken);
        return new UsedLink(familyId);
    }

    /// <summary>Cancels the family's waiting links and deletes it; nobody's money is touched (open point 6).</summary>
    public static async Task DeleteAsync(
        AppDbContext dbContext, Family family, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await dbContext.Invitations
            .Where(WaitingOf(family.Id, now))
            .ExecuteUpdateAsync(set => set.SetProperty(i => i.CancelledAt, now), cancellationToken);
        dbContext.Families.Remove(family);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Takes people whose accounts are about to be deleted out of their families: an owner's family goes to whoever has
    /// been in it longest, a family left empty is deleted. Call inside the deletion's transaction.
    /// </summary>
    public static async Task LoseAsync(
        AppDbContext dbContext, IReadOnlyCollection<Guid> userIds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var families = await dbContext.Families
            .Include(f => f.Members)
            .Where(f => f.Members.Any(m => userIds.Contains(m.UserId)))
            .ToListAsync(cancellationToken);

        foreach (var family in families)
        {
            if (family.Lose(userIds))
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            else
            {
                await DeleteAsync(dbContext, family, now, cancellationToken);
            }
        }
    }
}
