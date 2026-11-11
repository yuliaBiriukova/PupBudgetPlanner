namespace PupBudgetPlanner.Application.Categories;

/// <summary>
/// A person's category groups and categories: read (F-015) and changed (F-029) by their owner only; someone else's id
/// is as good as a made-up one (<see cref="Domain.Categories.CategoryOutcome.NotFound"/>). The rules live in
/// <see cref="Domain.Categories.CategorySet"/>. Implemented with EF Core in Infrastructure.
/// </summary>
public interface ICategoryService
{
    Task<CategoriesOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken);

    Task<CategoryResult> AddCategoryAsync(Guid userId, AddCategoryRequest request, CancellationToken cancellationToken);

    Task<CategoryResult> UpdateCategoryAsync(
        Guid userId, Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken);

    /// <summary>Deletes it when no transaction has it, otherwise hides it.</summary>
    Task<CategoryResult> RemoveCategoryAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken);

    Task<CategoryResult> RestoreCategoryAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken);

    Task<CategoryResult> AddGroupAsync(Guid userId, AddGroupRequest request, CancellationToken cancellationToken);

    Task<CategoryResult> UpdateGroupAsync(
        Guid userId, Guid groupId, UpdateGroupRequest request, CancellationToken cancellationToken);

    /// <summary>Deletes it when empty, hides it when it holds only hidden categories; otherwise it stays.</summary>
    Task<CategoryResult> RemoveGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken);

    Task<CategoryResult> RestoreGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken);
}
