using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>
/// The invite link a new account is created with (F-028). When <paramref name="Required"/> is false (open sign-up)
/// a link that doesn't work is ignored instead of stopping the sign-up.
/// </summary>
internal sealed record InvitationUse(byte[] TokenHash, bool Required);

internal enum AccountCreation
{
    Created,

    /// <summary>Identity refused the account; with the validators in front, that is a taken email.</summary>
    Refused,

    /// <summary>The required invitation was used, expired, cancelled or unknown; nothing was saved.</summary>
    InvitationInvalid,
}

/// <summary>Creates a new person's account with everything it starts with.</summary>
internal interface IAccountCreator
{
    /// <summary>
    /// Creates the account with <paramref name="password"/>, or without one (<c>null</c>) when the person signs in
    /// with a provider only, and uses up <paramref name="invitation"/> if there is one.
    /// </summary>
    Task<AccountCreation> CreateAsync(
        AppUser user, string? password, InvitationUse? invitation, CancellationToken cancellationToken);
}

/// <summary>
/// Saves the account, its copy of the default categories and the used invitation in one transaction, so nobody ends
/// up with an account but no categories (F-013), and one link can't create two accounts (F-028).
/// </summary>
internal sealed class AccountCreator(UserManager<AppUser> userManager, AppDbContext dbContext, TimeProvider clock)
    : IAccountCreator
{
    public async Task<AccountCreation> CreateAsync(
        AppUser user, string? password, InvitationUse? invitation, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        user.CreatedAt = now;

        // The user store saves through the same scoped context, so it joins this transaction
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var created = password is null
            ? await userManager.CreateAsync(user)
            : await userManager.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            return AccountCreation.Refused;
        }

        if (invitation is not null && !await UseInvitationAsync(invitation.TokenHash, user.Id, now, cancellationToken)
            && invitation.Required)
        {
            // Disposing the transaction without committing rolls the account back
            return AccountCreation.InvitationInvalid;
        }

        dbContext.CategoryGroups.AddRange(DefaultCategories.CreateFor(user.Id));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return AccountCreation.Created;
    }

    /// <summary>
    /// One conditional UPDATE: only a waiting invitation (not used, not cancelled, not expired) changes. A second
    /// sign-up racing for the same link waits for the first one's row lock and then matches nothing.
    /// </summary>
    private async Task<bool> UseInvitationAsync(
        byte[] tokenHash, Guid userId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var updated = await dbContext.Invitations
            .Where(i => i.TokenHash == tokenHash && i.UsedAt == null && i.CancelledAt == null && i.ExpiresAt > now)
            .ExecuteUpdateAsync(
                set => set.SetProperty(i => i.UsedById, userId).SetProperty(i => i.UsedAt, now),
                cancellationToken);
        return updated == 1;
    }
}
