using Microsoft.AspNetCore.Identity;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>Creates a new person's account with everything it starts with.</summary>
internal interface IAccountCreator
{
    /// <summary>
    /// Creates the account with <paramref name="password"/>, or without one (<c>null</c>) when the person signs in
    /// with a provider only.
    /// </summary>
    Task<IdentityResult> CreateAsync(AppUser user, string? password, CancellationToken cancellationToken);
}

/// <summary>
/// Saves the account and its copy of the default categories in one transaction, so nobody ends up with an
/// account but no categories (F-013).
/// </summary>
internal sealed class AccountCreator(UserManager<AppUser> userManager, AppDbContext dbContext) : IAccountCreator
{
    public async Task<IdentityResult> CreateAsync(AppUser user, string? password, CancellationToken cancellationToken)
    {
        // The user store saves through the same scoped context, so it joins this transaction
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var created = password is null
            ? await userManager.CreateAsync(user)
            : await userManager.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            return created;
        }

        dbContext.CategoryGroups.AddRange(DefaultCategories.CreateFor(user.Id));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return created;
    }
}
