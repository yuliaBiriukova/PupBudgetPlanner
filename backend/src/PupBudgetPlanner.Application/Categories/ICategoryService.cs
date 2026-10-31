namespace PupBudgetPlanner.Application.Categories;

/// <summary>
/// A person's category groups and categories (F-015), read-only: changing them comes after the MVP (Q-003).
/// Implemented with EF Core in Infrastructure.
/// </summary>
public interface ICategoryService
{
    Task<CategoriesOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken);
}
