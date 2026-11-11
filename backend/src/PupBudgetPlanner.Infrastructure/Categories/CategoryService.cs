using Microsoft.EntityFrameworkCore;
using Npgsql;
using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Categories;

/// <summary>
/// Loads the person's whole set (a few dozen rows), lets <see cref="CategorySet"/> change it and saves the changed
/// rows: a change renumbers the places of a group's categories or of the groups.
/// </summary>
internal sealed class CategoryService(AppDbContext dbContext) : ICategoryService
{
    /// <summary>The unique names' indexes (<see cref="CategoryConfiguration"/>): a twin saved meanwhile.</summary>
    private static readonly string[] NameIndexes = ["ix_category_groups_user_id_name", "ix_categories_group_id_name"];

    public async Task<CategoriesOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken)
    {
        var groups = await dbContext.CategoryGroups.AsNoTracking()
            .Where(group => group.UserId == userId)
            .Include(group => group.Categories)
            .ToListAsync(cancellationToken);

        var counts = await dbContext.Transactions.AsNoTracking()
            .Where(transaction => transaction.UserId == userId && transaction.CategoryId != null)
            .GroupBy(transaction => transaction.CategoryId!.Value)
            .Select(group => new { CategoryId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(row => row.CategoryId, row => row.Count, cancellationToken);

        return CategoriesOverview.From(userId, groups, counts);
    }

    public async Task<CategoryResult> AddCategoryAsync(
        Guid userId, AddCategoryRequest request, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        var change = set.AddCategory(request.GroupId, request.Name, request.Place);
        if (change.Category is { } category)
        {
            dbContext.Categories.Add(category);
        }

        return await SavedAsync(change.Outcome, change.Category?.Id, null, cancellationToken);
    }

    public async Task<CategoryResult> UpdateCategoryAsync(
        Guid userId, Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        var change = set.UpdateCategory(categoryId, request.Name, request.GroupId, request.Place);
        return await SavedAsync(change.Outcome, change.Category?.Id, null, cancellationToken);
    }

    public async Task<CategoryResult> RemoveCategoryAsync(
        Guid userId, Guid categoryId, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        var count = await dbContext.Transactions.CountAsync(
            transaction => transaction.CategoryId == categoryId, cancellationToken);
        var removal = set.RemoveCategory(categoryId, count);
        if (removal.Removed is { } removed)
        {
            dbContext.Categories.Remove(removed);
        }

        return await SavedAsync(removal.Outcome, categoryId, removal.Removal, cancellationToken);
    }

    public async Task<CategoryResult> RestoreCategoryAsync(
        Guid userId, Guid categoryId, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        return await SavedAsync(set.RestoreCategory(categoryId).Outcome, categoryId, null, cancellationToken);
    }

    public async Task<CategoryResult> AddGroupAsync(
        Guid userId, AddGroupRequest request, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        var change = set.AddGroup(request.Kind, request.Name, request.Place);
        if (change.Group is { } group)
        {
            dbContext.CategoryGroups.Add(group);
        }

        return await SavedAsync(change.Outcome, change.Group?.Id, null, cancellationToken);
    }

    public async Task<CategoryResult> UpdateGroupAsync(
        Guid userId, Guid groupId, UpdateGroupRequest request, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        var change = set.UpdateGroup(groupId, request.Name, request.Place);
        return await SavedAsync(change.Outcome, groupId, null, cancellationToken);
    }

    public async Task<CategoryResult> RemoveGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        var removal = set.RemoveGroup(groupId);
        if (removal.Removed is { } removed)
        {
            dbContext.CategoryGroups.Remove(removed);
        }

        return await SavedAsync(removal.Outcome, groupId, removal.Removal, cancellationToken);
    }

    public async Task<CategoryResult> RestoreGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken)
    {
        var set = await SetAsync(userId, cancellationToken);
        return await SavedAsync(set.RestoreGroup(groupId).Outcome, groupId, null, cancellationToken);
    }

    /// <summary>Only the person's own groups and categories, tracked: someone else's id is as good as a made-up one.</summary>
    private async Task<CategorySet> SetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var groups = await dbContext.CategoryGroups
            .Where(group => group.UserId == userId)
            .Include(group => group.Categories)
            .ToListAsync(cancellationToken);
        return new CategorySet(userId, groups);
    }

    /// <summary>
    /// Saves a change that went through; a twin's name saved meanwhile (another tab, two saves at once) is caught by
    /// the database's unique index and is <see cref="CategoryOutcome.NameTaken"/> like the check before it.
    /// </summary>
    private async Task<CategoryResult> SavedAsync(
        CategoryOutcome outcome, Guid? id, Removal? removal, CancellationToken cancellationToken)
    {
        if (outcome != CategoryOutcome.Done)
        {
            return new CategoryResult(outcome);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return new CategoryResult(outcome, id, removal);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
        } unique && NameIndexes.Contains(unique.ConstraintName))
        {
            return new CategoryResult(CategoryOutcome.NameTaken);
        }
    }
}
