using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Categories;

/// <summary>
/// One category in a group. A hidden one (F-029) isn't offered for new transactions; its transactions keep it.
/// <see cref="TransactionCount"/> says whether removing it deletes it (none) or hides it.
/// <see cref="IsPrivate"/>: the other members of the family see nothing of it (F-030).
/// </summary>
public sealed record CategoryItem(Guid Id, string Name, bool IsHidden, int TransactionCount, bool IsPrivate = false);

/// <summary>
/// One of the person's category groups with its shown categories in order, then the hidden ones.
/// <see cref="IsPrivate"/>: the family sees nothing of the whole group, its categories added later too (F-030).
/// </summary>
public sealed record CategoryGroupItem(
    Guid Id, string Name, CategoryKind Kind, bool IsHidden, IReadOnlyList<CategoryItem> Categories, bool IsPrivate);

/// <summary>
/// The person's whole set (F-015, F-029): the groups in the report's order (income first), hidden ones included and
/// marked. The quick-add form leaves the hidden ones out; the Categories page shows them quiet, with Show again.
/// </summary>
public sealed record CategoriesOverview(IReadOnlyList<CategoryGroupItem> Groups)
{
    public static CategoriesOverview From(
        Guid userId, IEnumerable<CategoryGroup> groups, IReadOnlyDictionary<Guid, int> transactionCounts)
    {
        var set = new CategorySet(userId, groups);
        return new CategoriesOverview(set.Groups
            .Select(group => new CategoryGroupItem(
                group.Id,
                group.Name,
                group.Kind,
                group.IsArchived,
                set.CategoriesOf(group.Id)
                    .Select(category => new CategoryItem(
                        category.Id,
                        category.Name,
                        category.IsArchived,
                        transactionCounts.GetValueOrDefault(category.Id),
                        category.IsPrivate))
                    .ToList(),
                group.IsPrivate))
            .ToList());
    }
}

/// <summary>A new category in a group, at <see cref="Place"/> among its shown ones (0: first; null: at the end).</summary>
public sealed record AddCategoryRequest(Guid GroupId, string Name, int? Place);

/// <summary>
/// A category's name, group (one of its kind) and place among the group's other shown ones (null: kept, or the end of
/// another group).
/// </summary>
public sealed record UpdateCategoryRequest(string Name, Guid GroupId, int? Place);

/// <summary>A new group of a kind, at <see cref="Place"/> among the shown groups of that kind (null: at the end).</summary>
public sealed record AddGroupRequest(CategoryKind Kind, string Name, int? Place);

/// <summary>A group's name and place among the other shown groups of its kind (null: kept).</summary>
public sealed record UpdateGroupRequest(string Name, int? Place);

/// <summary>The id of what was added.</summary>
public sealed record AddedItem(Guid Id);

/// <summary>What removing did: deleted for good, or hidden because its transactions keep it.</summary>
public sealed record RemovedItem(Removal Removal);

/// <summary>A change with what it came to, and what was added or removed when it went through.</summary>
public sealed record CategoryResult(CategoryOutcome Outcome, Guid? Id = null, Removal? Removal = null);
