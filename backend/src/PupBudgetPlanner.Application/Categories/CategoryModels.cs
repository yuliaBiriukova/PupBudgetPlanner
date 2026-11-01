using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Categories;

/// <summary>One category in a group.</summary>
public sealed record CategoryItem(Guid Id, string Name);

/// <summary>One of the person's category groups with its categories in the report's order.</summary>
public sealed record CategoryGroupItem(Guid Id, string Name, CategoryKind Kind, IReadOnlyList<CategoryItem> Categories);

/// <summary>
/// Everything the Categories page shows (F-015): the person's groups in the report's order, each with the categories
/// in use. Archived categories are left out: they stay only for the transactions and reports that use them.
/// </summary>
public sealed record CategoriesOverview(IReadOnlyList<CategoryGroupItem> Groups)
{
    public static CategoriesOverview From(IEnumerable<CategoryGroup> groups) =>
        new(groups
            .OrderBy(group => group.SortOrder)
            .Select(group => new CategoryGroupItem(
                group.Id,
                group.Name,
                group.Kind,
                group.Categories
                    .Where(category => !category.IsArchived)
                    .OrderBy(category => category.SortOrder)
                    .Select(category => new CategoryItem(category.Id, category.Name))
                    .ToList()))
            .ToList());
}
