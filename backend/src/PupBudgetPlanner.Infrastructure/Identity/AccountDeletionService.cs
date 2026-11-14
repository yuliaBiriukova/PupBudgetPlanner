using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Infrastructure.Families;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>
/// Deleting one's own account (F-027). The database removes everything that belongs to the account with it (accounts,
/// transactions, categories, logins; ADR 0016); the family goes on without the person first, as "Leave family" does.
/// </summary>
internal sealed class AccountDeletionService(
    AppDbContext dbContext,
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IOptions<AccessOptions> access,
    TimeProvider clock) : IAccountDeletionService
{
    public async Task<DeletionSummary?> SummaryAsync(
        Guid userId, bool googleConfirmed, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Email, HasPassword = u.PasswordHash != null })
            .SingleOrDefaultAsync(cancellationToken);
        if (user is null)
        {
            return null;
        }

        var accounts = await dbContext.Accounts.CountAsync(a => a.UserId == userId, cancellationToken);
        var transactions = await dbContext.Transactions.CountAsync(t => t.UserId == userId, cancellationToken);
        var categories = await dbContext.CategoryGroups
            .Where(g => g.UserId == userId)
            .SelectMany(g => g.Categories)
            .CountAsync(cancellationToken);

        return new DeletionSummary(
            accounts,
            transactions,
            categories,
            user.HasPassword,
            CanDelete: !access.Value.IsAdmin(user.Email),
            GoogleConfirmed: googleConfirmed);
    }

    public async Task<bool> IsOwnGoogleLoginAsync(Guid userId, CancellationToken cancellationToken)
    {
        var login = await signInManager.GetExternalLoginInfoAsync();
        // Only a confirmation: the Google login never signs anyone in here
        await signInManager.Context.SignOutAsync(IdentityConstants.ExternalScheme);
        if (login is null)
        {
            return false;
        }

        var owner = await userManager.FindByLoginAsync(login.LoginProvider, login.ProviderKey);
        return owner?.Id == userId;
    }

    public async Task<DeleteMyAccountOutcome> DeleteAsync(
        Guid userId, DeleteMyAccountRequest request, bool googleConfirmed, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return DeleteMyAccountOutcome.NotFound;
        }

        var hasPassword = user.PasswordHash is not null;
        if (AccountDeletionRules.Refusal(access.Value.IsAdmin(user.Email), hasPassword, request, googleConfirmed)
            is { } refusal)
        {
            return refusal;
        }

        if (hasPassword)
        {
            // The same lockout as signing in, so the dialog can't be used to guess the password
            var check = await signInManager.CheckPasswordSignInAsync(user, request.Password!, lockoutOnFailure: true);
            if (check.IsLockedOut)
            {
                return DeleteMyAccountOutcome.LockedOut;
            }

            if (!check.Succeeded)
            {
                return DeleteMyAccountOutcome.WrongPassword;
            }
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var family = await dbContext.Families
            .Include(f => f.Members)
            .SingleOrDefaultAsync(f => f.Members.Any(m => m.UserId == userId), cancellationToken);
        if (family is not null)
        {
            switch (family.Leave(userId, request.NewOwnerId))
            {
                case LeaveOutcome.Left or LeaveOutcome.HandedOver:
                    await dbContext.SaveChangesAsync(cancellationToken);
                    break;
                case LeaveOutcome.Emptied:
                    await FamilyCleanup.DeleteAsync(dbContext, family, clock.GetUtcNow(), cancellationToken);
                    break;
                case LeaveOutcome.NewOwnerNeeded:
                    return DeleteMyAccountOutcome.NewOwnerNeeded;
                case LeaveOutcome.NoSuchNewOwner:
                    return DeleteMyAccountOutcome.NoSuchNewOwner;
            }
        }

        var deleted = await userManager.DeleteAsync(user);
        if (!deleted.Succeeded)
        {
            throw new InvalidOperationException(
                $"Deleting account {user.Id} failed: {string.Join("; ", deleted.Errors.Select(e => e.Description))}");
        }

        await transaction.CommitAsync(cancellationToken);
        return DeleteMyAccountOutcome.Deleted;
    }
}
