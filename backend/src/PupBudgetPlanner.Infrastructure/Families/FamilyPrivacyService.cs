using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Families;

internal sealed class FamilyPrivacyService(AppDbContext dbContext) : IFamilyPrivacyService
{
    public Task ShareTransactionsAsync(Guid userId, TransactionShare share, CancellationToken cancellationToken) =>
        dbContext.Users
            .Where(user => user.Id == userId)
            .ExecuteUpdateAsync(set => set.SetProperty(user => user.FamilySeesTransactions, share), cancellationToken);

    /// <summary>Only the person's own accounts: someone else's id is as good as a made-up one.</summary>
    public async Task<bool> ShareAccountAsync(
        Guid userId, Guid accountId, AccountShare share, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts.SingleOrDefaultAsync(
            account => account.Id == accountId && account.UserId == userId, cancellationToken);
        if (account is null)
        {
            return false;
        }

        account.ShareWithFamily(share);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>Only the person's own categories, hidden ones too: their transactions are still there.</summary>
    public async Task<bool> KeepCategoryAsync(
        Guid userId, Guid categoryId, bool isPrivate, CancellationToken cancellationToken)
    {
        var category = await (
                from item in dbContext.Categories
                join categoryGroup in dbContext.CategoryGroups on item.GroupId equals categoryGroup.Id
                where item.Id == categoryId && categoryGroup.UserId == userId
                select item)
            .SingleOrDefaultAsync(cancellationToken);
        if (category is null)
        {
            return false;
        }

        category.IsPrivate = isPrivate;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
