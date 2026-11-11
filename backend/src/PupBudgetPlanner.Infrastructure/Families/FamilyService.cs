using Microsoft.EntityFrameworkCore;
using Npgsql;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Access;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Families;

internal sealed class FamilyService(AppDbContext dbContext, TimeProvider clock) : IFamilyService
{
    public async Task<FamilyView?> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var family = await FamilyOfAsync(userId, tracked: false, cancellationToken);
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
            .Select(m => new FamilyMemberItem(
                m.UserId,
                names.GetValueOrDefault(m.UserId, string.Empty),
                family.IsOwner(m.UserId),
                m.UserId == userId,
                family.StartedBy(m.UserId),
                m.JoinedAt))
            .ToList();

        // A link is shown once, when it is made (F-028); the owner sees the waiting ones to cancel them
        IReadOnlyList<FamilyInvitationItem> invitations = [];
        if (family.IsOwner(userId))
        {
            var now = clock.GetUtcNow();
            invitations = await dbContext.Invitations.AsNoTracking()
                .Where(FamilyCleanup.WaitingOf(family.Id, now))
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new FamilyInvitationItem(i.Id, i.Note, i.CreatedAt, i.ExpiresAt))
                .ToListAsync(cancellationToken);
        }

        return new FamilyView(family.Id, family.Name, family.CreatedAt, family.IsOwner(userId), members, invitations);
    }

    public async Task<FamilyActionOutcome> StartAsync(
        Guid userId, StartFamilyRequest request, CancellationToken cancellationToken)
    {
        if (await InAFamilyAsync(userId, cancellationToken))
        {
            return FamilyActionOutcome.AlreadyInFamily;
        }

        dbContext.Families.Add(Family.Start(userId, request.Name, clock.GetUtcNow()));
        return await SavedAsync(cancellationToken) ? FamilyActionOutcome.Done : FamilyActionOutcome.AlreadyInFamily;
    }

    public Task<FamilyActionOutcome> RenameAsync(
        Guid userId, RenameFamilyRequest request, CancellationToken cancellationToken) =>
        ChangeAsync(userId, family => family.Rename(userId, request.Name), cancellationToken);

    public async Task<(FamilyActionOutcome Outcome, CreatedInvitation? Invitation)> InviteAsync(
        Guid userId, CreateInvitationRequest request, CancellationToken cancellationToken)
    {
        var family = await FamilyOfAsync(userId, tracked: false, cancellationToken);
        if (family is null)
        {
            return (FamilyActionOutcome.NoFamily, null);
        }

        if (!family.IsOwner(userId))
        {
            return (FamilyActionOutcome.NotOwner, null);
        }

        var token = InvitationToken.New();
        var invitation = Invitation.Create(
            InvitationToken.Hash(token), request.Note, userId, clock.GetUtcNow(), family.Id);
        dbContext.Invitations.Add(invitation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (FamilyActionOutcome.Done, new CreatedInvitation(invitation.Id, token, invitation.Note, invitation.ExpiresAt));
    }

    public async Task<FamilyActionOutcome> CancelInvitationAsync(
        Guid userId, Guid invitationId, CancellationToken cancellationToken)
    {
        var family = await FamilyOfAsync(userId, tracked: false, cancellationToken);
        if (family is null)
        {
            return FamilyActionOutcome.NoFamily;
        }

        if (!family.IsOwner(userId))
        {
            return FamilyActionOutcome.NotOwner;
        }

        var invitation = await dbContext.Invitations
            .SingleOrDefaultAsync(i => i.Id == invitationId && i.FamilyId == family.Id, cancellationToken);
        if (invitation is null)
        {
            return FamilyActionOutcome.NotFound;
        }

        if (!invitation.Cancel(clock.GetUtcNow()))
        {
            return FamilyActionOutcome.NotWaiting;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return FamilyActionOutcome.Done;
    }

    public Task<FamilyActionOutcome> RemoveAsync(Guid userId, Guid memberId, CancellationToken cancellationToken) =>
        ChangeAsync(userId, family => family.Remove(userId, memberId), cancellationToken);

    public async Task<FamilyActionOutcome> LeaveAsync(
        Guid userId, LeaveFamilyRequest request, CancellationToken cancellationToken)
    {
        var family = await FamilyOfAsync(userId, tracked: true, cancellationToken);
        if (family is null)
        {
            return FamilyActionOutcome.NoFamily;
        }

        switch (family.Leave(userId, request.NewOwnerId))
        {
            case LeaveOutcome.Left or LeaveOutcome.HandedOver:
                await dbContext.SaveChangesAsync(cancellationToken);
                return FamilyActionOutcome.Done;
            case LeaveOutcome.Emptied:
                await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
                {
                    await FamilyCleanup.DeleteAsync(dbContext, family, clock.GetUtcNow(), cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                }

                return FamilyActionOutcome.Done;
            case LeaveOutcome.NotMember:
                return FamilyActionOutcome.NoFamily;
            default:
                return FamilyActionOutcome.NewOwnerNeeded;
        }
    }

    public async Task<FamilyActionOutcome> JoinAsync(
        Guid userId, JoinFamilyRequest request, CancellationToken cancellationToken)
    {
        if (await InAFamilyAsync(userId, cancellationToken))
        {
            return FamilyActionOutcome.AlreadyInFamily;
        }

        var now = clock.GetUtcNow();
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var used = await FamilyCleanup.UseLinkAsync(
            dbContext, InvitationToken.Hash(request.Token), userId, now, createdAccount: false, cancellationToken);
        var family = used?.FamilyId is { } familyId
            ? await dbContext.Families.Include(f => f.Members).SingleOrDefaultAsync(f => f.Id == familyId, cancellationToken)
            : null;
        if (family is null)
        {
            // Disposing the transaction without committing leaves the link as it was
            return FamilyActionOutcome.InvitationGone;
        }

        family.Join(userId, now);
        if (!await SavedAsync(cancellationToken))
        {
            return FamilyActionOutcome.AlreadyInFamily;
        }

        await transaction.CommitAsync(cancellationToken);
        return FamilyActionOutcome.Done;
    }

    /// <summary>Loads the person's family, applies <paramref name="change"/> and saves it when it was done.</summary>
    private async Task<FamilyActionOutcome> ChangeAsync(
        Guid userId, Func<Family, FamilyOutcome> change, CancellationToken cancellationToken)
    {
        var family = await FamilyOfAsync(userId, tracked: true, cancellationToken);
        if (family is null)
        {
            return FamilyActionOutcome.NoFamily;
        }

        var outcome = change(family);
        if (outcome == FamilyOutcome.Done)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return outcome switch
        {
            FamilyOutcome.Done => FamilyActionOutcome.Done,
            FamilyOutcome.NotOwner => FamilyActionOutcome.NotOwner,
            FamilyOutcome.IsOwner => FamilyActionOutcome.IsOwner,
            _ => FamilyActionOutcome.NotFound,
        };
    }

    private Task<Family?> FamilyOfAsync(Guid userId, bool tracked, CancellationToken cancellationToken)
    {
        var families = tracked ? dbContext.Families : dbContext.Families.AsNoTracking();
        return families.Include(f => f.Members)
            .SingleOrDefaultAsync(f => f.Members.Any(m => m.UserId == userId), cancellationToken);
    }

    private Task<bool> InAFamilyAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.FamilyMembers.AnyAsync(m => m.UserId == userId, cancellationToken);

    /// <summary>Saves; false when the person got into a family at the same moment (the one-family index).</summary>
    private async Task<bool> SavedAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: FamilyMemberConfiguration.OneFamilyIndex,
        })
        {
            return false;
        }
    }
}
