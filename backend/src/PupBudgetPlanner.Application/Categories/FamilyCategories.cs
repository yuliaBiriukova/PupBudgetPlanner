using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Categories;

/// <summary>
/// Several people's categories as one set, for the family's money (F-024, open point 5): groups of the same kind and
/// name are one group, and in it categories of the same name are one category, ignoring case and spaces at the ends.
/// The first person's (the viewer's) groups and categories come first in their order; ones only someone else has
/// follow, a category at its group's end and a group after the others. A merged category or group keeps the first
/// one's id and name, and is hidden only when every one of its parts is (F-029). Pure, so it is tested alone.
/// </summary>
public sealed class FamilyCategories
{
    private readonly Dictionary<Guid, Guid> mergedIdOf;
    private readonly ILookup<Guid, Guid> partsOf;

    private FamilyCategories(IReadOnlyList<CategoryGroup> groups, Dictionary<Guid, Guid> mergedIdOf)
    {
        Groups = groups;
        this.mergedIdOf = mergedIdOf;
        partsOf = mergedIdOf.ToLookup(pair => pair.Value, pair => pair.Key);
    }

    /// <summary>The merged groups with their merged categories, numbered in their new order.</summary>
    public IReadOnlyList<CategoryGroup> Groups { get; }

    /// <summary>
    /// <paramref name="people"/>'s groups (with their categories) merged, in the order of <paramref name="people"/>;
    /// groups of anyone else are left out.
    /// </summary>
    public static FamilyCategories Of(IReadOnlyList<Guid> people, IEnumerable<CategoryGroup> groups)
    {
        var all = groups.ToList();
        var merged = new List<CategoryGroup>();
        var groupOf = new Dictionary<(CategoryKind Kind, string Name), CategoryGroup>();
        var mergedIdOf = new Dictionary<Guid, Guid>();

        foreach (var person in people)
        {
            foreach (var group in all.Where(group => group.UserId == person).OrderBy(group => group.SortOrder))
            {
                var key = (group.Kind, Key(group.Name));
                if (!groupOf.TryGetValue(key, out var into))
                {
                    into = new CategoryGroup
                    {
                        Id = group.Id,
                        UserId = group.UserId,
                        Name = group.Name,
                        Kind = group.Kind,
                        SortOrder = merged.Count + 1,
                        IsArchived = group.IsArchived,
                    };
                    groupOf[key] = into;
                    merged.Add(into);
                }
                else
                {
                    into.IsArchived &= group.IsArchived;
                }

                foreach (var category in group.Categories.OrderBy(category => category.SortOrder))
                {
                    var same = into.Categories.FirstOrDefault(item => Key(item.Name) == Key(category.Name));
                    if (same is null)
                    {
                        same = new Category
                        {
                            Id = category.Id,
                            GroupId = into.Id,
                            Name = category.Name,
                            SortOrder = into.Categories.Count + 1,
                            IsArchived = category.IsArchived,
                        };
                        into.Categories.Add(same);
                    }
                    else
                    {
                        same.IsArchived &= category.IsArchived;
                    }

                    mergedIdOf[category.Id] = same.Id;
                }
            }
        }

        return new FamilyCategories(merged, mergedIdOf);
    }

    /// <summary>The id of the merged category <paramref name="categoryId"/> is part of (itself when it is unknown).</summary>
    public Guid MergedIdOf(Guid categoryId) => mergedIdOf.GetValueOrDefault(categoryId, categoryId);

    /// <summary>Every category that counts as the same one as <paramref name="categoryId"/>, itself included.</summary>
    public IReadOnlyList<Guid> SameAs(Guid categoryId)
    {
        var parts = partsOf[MergedIdOf(categoryId)].ToList();
        return parts.Count == 0 ? [categoryId] : parts;
    }

    /// <summary>The merged categories' names by their ids.</summary>
    public IReadOnlyDictionary<Guid, string> Names() =>
        Groups.SelectMany(group => group.Categories).ToDictionary(category => category.Id, category => category.Name);

    private static string Key(string name) => name.Trim().ToLowerInvariant();
}
