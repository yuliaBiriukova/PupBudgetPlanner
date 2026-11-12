using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Infrastructure.Families;
using PupBudgetPlanner.Infrastructure.Identity;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Access;

internal sealed class PeopleService(
    AppDbContext dbContext,
    UserManager<AppUser> userManager,
    IOptions<AccessOptions> access,
    TimeProvider clock) : IPeopleService
{
    public async Task<IReadOnlyList<PersonItem>> ListAsync(Guid adminId, CancellationToken cancellationToken)
    {
        // "Invited" and its note are kept on the account, so deleting the link doesn't drop them (I-006)
        var rows = await dbContext.Users.AsNoTracking()
            .Select(user => new
            {
                user.Id,
                user.DisplayName,
                user.Email,
                user.CreatedAt,
                user.BlockedAt,
                user.Invited,
                user.InvitationNote,
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new PersonItem(
                row.Id,
                row.DisplayName,
                row.Email ?? string.Empty,
                row.CreatedAt,
                access.Value.IsAdmin(row.Email),
                row.Id == adminId,
                row.Invited,
                row.InvitationNote,
                row.BlockedAt))
            .OrderByDescending(person => person.IsYou)
            .ThenBy(person => person.DisplayName, StringComparer.CurrentCultureIgnoreCase)
            .ToList();
    }

    public Task<PeopleActionOutcome> BlockAsync(Guid adminId, PeopleRequest request, CancellationToken cancellationToken) =>
        ChangeAsync(adminId, request, async user =>
        {
            if (user.BlockedAt is not null)
            {
                return IdentityResult.Success;
            }

            user.BlockedAt = clock.GetUtcNow();
            // A new security stamp ends the person's cookies on every device at their next check (ADR 0016)
            return await userManager.UpdateSecurityStampAsync(user);
        }, first: null, cancellationToken);

    public Task<PeopleActionOutcome> UnblockAsync(Guid adminId, PeopleRequest request, CancellationToken cancellationToken) =>
        ChangeAsync(adminId, request, async user =>
        {
            if (user.BlockedAt is null)
            {
                return IdentityResult.Success;
            }

            user.BlockedAt = null;
            return await userManager.UpdateAsync(user);
        }, first: null, cancellationToken);

    // The database removes what belongs to the account with it (categories, logins; ADR 0016). Their families go on
    // without them first: an owner's to whoever has been in it longest, an emptied one is deleted (F-023)
    public Task<PeopleActionOutcome> DeleteAsync(Guid adminId, PeopleRequest request, CancellationToken cancellationToken) =>
        ChangeAsync(
            adminId,
            request,
            userManager.DeleteAsync,
            ids => FamilyCleanup.LoseAsync(dbContext, ids, clock.GetUtcNow(), cancellationToken),
            cancellationToken);

    /// <summary>
    /// Applies <paramref name="change"/> to every picked account in one transaction: all of them or none, after
    /// <paramref name="first"/> if given. The admin can't pick themselves.
    /// </summary>
    private async Task<PeopleActionOutcome> ChangeAsync(
        Guid adminId,
        PeopleRequest request,
        Func<AppUser, Task<IdentityResult>> change,
        Func<IReadOnlyCollection<Guid>, Task>? first,
        CancellationToken cancellationToken)
    {
        var ids = request.UserIds.Distinct().ToList();
        if (ids.Contains(adminId))
        {
            return PeopleActionOutcome.IncludesYou;
        }

        var users = await dbContext.Users.Where(user => ids.Contains(user.Id)).ToListAsync(cancellationToken);
        if (users.Count != ids.Count)
        {
            return PeopleActionOutcome.NotFound;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        if (first is not null)
        {
            await first(ids);
        }

        foreach (var user in users)
        {
            var result = await change(user);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Changing account {user.Id} failed: {string.Join("; ", result.Errors.Select(e => e.Description))}");
            }
        }

        await transaction.CommitAsync(cancellationToken);
        return PeopleActionOutcome.Done;
    }
}
