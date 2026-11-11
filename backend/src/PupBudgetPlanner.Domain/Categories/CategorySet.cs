namespace PupBudgetPlanner.Domain.Categories;

/// <summary>What a change to a person's categories came to (F-029).</summary>
public enum CategoryOutcome
{
    Done,

    /// <summary>The person has no such category or group.</summary>
    NotFound,

    /// <summary>Another category of the group, or another group of the person, has the name (case ignored).</summary>
    NameTaken,

    /// <summary>A hidden category of the group has the name: it can be shown again instead of making a twin.</summary>
    NameTakenByHidden,

    /// <summary>A category moves only to a group of its own kind (Income or Expense).</summary>
    OtherKind,

    /// <summary>A hidden category or group is shown again before it is changed; a hidden group takes no categories.</summary>
    Hidden,

    /// <summary>A group goes only once none of its categories is shown.</summary>
    StillHasCategories,

    /// <summary>The only shown group of its kind stays.</summary>
    LastOfKind,
}

/// <summary>What removing did: deleted for good, or hidden because its transactions keep it.</summary>
public enum Removal
{
    Deleted,
    Hidden,
}

public sealed record CategoryChange(CategoryOutcome Outcome, Category? Category = null);

public sealed record GroupChange(CategoryOutcome Outcome, CategoryGroup? Group = null);

/// <summary>A removal: <see cref="Removed"/> is set when it went for good, so the caller deletes it from the store.</summary>
public sealed record CategoryRemoval(CategoryOutcome Outcome, Removal? Removal = null, Category? Removed = null);

public sealed record GroupRemoval(CategoryOutcome Outcome, Removal? Removal = null, CategoryGroup? Removed = null);

/// <summary>
/// One person's whole set of groups and categories and the rules for changing it (F-029): names unique per place
/// (group names per person, category names per group, hidden ones counting, case ignored), a place given among the
/// shown ones, hide instead of delete once something uses it. Every change renumbers the sort orders from 1: the income
/// groups first, then the expense ones; in a group the shown categories, then the hidden ones.
/// </summary>
public sealed class CategorySet
{
    private readonly Guid userId;
    private readonly List<CategoryGroup> groups;
    private readonly List<Category> categories;

    /// <param name="userId">The person whose set it is.</param>
    /// <param name="groups">All of the person's groups with their categories loaded.</param>
    public CategorySet(Guid userId, IEnumerable<CategoryGroup> groups)
    {
        this.userId = userId;
        this.groups = [.. groups];
        categories = [.. this.groups.SelectMany(group => group.Categories)];
    }

    /// <summary>The groups in the report's order.</summary>
    public IReadOnlyList<CategoryGroup> Groups =>
        [.. groups.OrderBy(group => KindOrder(group.Kind)).ThenBy(group => group.SortOrder)];

    /// <summary>A group's shown categories in order, then its hidden ones.</summary>
    public IReadOnlyList<Category> CategoriesOf(Guid groupId) =>
        [.. categories.Where(category => category.GroupId == groupId)
            .OrderBy(category => category.IsArchived)
            .ThenBy(category => category.SortOrder)];

    public CategoryChange AddCategory(Guid groupId, string name, int? place)
    {
        var group = FindGroup(groupId);
        if (group is null)
        {
            return new CategoryChange(CategoryOutcome.NotFound);
        }

        if (group.IsArchived)
        {
            return new CategoryChange(CategoryOutcome.Hidden);
        }

        var clash = CategoryNameClash(group.Id, name, null);
        if (clash != CategoryOutcome.Done)
        {
            return new CategoryChange(clash);
        }

        var category = new Category { Id = Guid.CreateVersion7(), GroupId = group.Id, Name = name.Trim() };
        categories.Add(category);
        PlaceCategory(category, place);
        return new CategoryChange(CategoryOutcome.Done, category);
    }

    /// <summary>Renames it and puts it at <paramref name="place"/> among the shown ones of the group (the end when null).</summary>
    public CategoryChange UpdateCategory(Guid categoryId, string name, Guid groupId, int? place)
    {
        var category = FindCategory(categoryId);
        var group = FindGroup(groupId);
        if (category is null || group is null)
        {
            return new CategoryChange(CategoryOutcome.NotFound);
        }

        var from = FindGroup(category.GroupId)!;
        if (group.Kind != from.Kind)
        {
            return new CategoryChange(CategoryOutcome.OtherKind);
        }

        if (category.IsArchived || group.IsArchived)
        {
            return new CategoryChange(CategoryOutcome.Hidden);
        }

        var clash = CategoryNameClash(group.Id, name, category.Id);
        if (clash != CategoryOutcome.Done)
        {
            return new CategoryChange(clash);
        }

        category.Name = name.Trim();
        if (group.Id != from.Id)
        {
            category.GroupId = group.Id;
            Renumber(from);
            PlaceCategory(category, place);
        }
        else if (place is not null)
        {
            PlaceCategory(category, place);
        }

        return new CategoryChange(CategoryOutcome.Done, category);
    }

    /// <summary>Deleted when nothing uses it, otherwise hidden at the end of its group.</summary>
    public CategoryRemoval RemoveCategory(Guid categoryId, int transactionCount)
    {
        var category = FindCategory(categoryId);
        if (category is null)
        {
            return new CategoryRemoval(CategoryOutcome.NotFound);
        }

        var group = FindGroup(category.GroupId)!;
        if (transactionCount == 0)
        {
            categories.Remove(category);
            Renumber(group);
            return new CategoryRemoval(CategoryOutcome.Done, Removal.Deleted, category);
        }

        if (!category.IsArchived)
        {
            category.IsArchived = true;
            category.SortOrder = int.MaxValue;
            Renumber(group);
        }

        return new CategoryRemoval(CategoryOutcome.Done, Removal.Hidden);
    }

    /// <summary>Shows a hidden category again at the end of its group, and the group too when it was hidden.</summary>
    public CategoryChange RestoreCategory(Guid categoryId)
    {
        var category = FindCategory(categoryId);
        if (category is null)
        {
            return new CategoryChange(CategoryOutcome.NotFound);
        }

        if (category.IsArchived)
        {
            category.IsArchived = false;
            FindGroup(category.GroupId)!.IsArchived = false;
            PlaceCategory(category, null);
        }

        return new CategoryChange(CategoryOutcome.Done, category);
    }

    public GroupChange AddGroup(CategoryKind kind, string name, int? place)
    {
        if (GroupNameClash(name, null))
        {
            return new GroupChange(CategoryOutcome.NameTaken);
        }

        var group = new CategoryGroup { Id = Guid.CreateVersion7(), UserId = userId, Name = name.Trim(), Kind = kind };
        groups.Add(group);
        PlaceGroup(group, place);
        return new GroupChange(CategoryOutcome.Done, group);
    }

    /// <summary>Renames it and puts it at <paramref name="place"/> among the shown groups of its kind (kept when null).</summary>
    public GroupChange UpdateGroup(Guid groupId, string name, int? place)
    {
        var group = FindGroup(groupId);
        if (group is null)
        {
            return new GroupChange(CategoryOutcome.NotFound);
        }

        if (group.IsArchived)
        {
            return new GroupChange(CategoryOutcome.Hidden);
        }

        if (GroupNameClash(name, group.Id))
        {
            return new GroupChange(CategoryOutcome.NameTaken);
        }

        group.Name = name.Trim();
        if (place is not null)
        {
            PlaceGroup(group, place);
        }

        return new GroupChange(CategoryOutcome.Done, group);
    }

    /// <summary>
    /// A group goes once none of its categories is shown: deleted when it has none, hidden with its hidden ones
    /// otherwise. The only shown group of a kind stays.
    /// </summary>
    public GroupRemoval RemoveGroup(Guid groupId)
    {
        var group = FindGroup(groupId);
        if (group is null)
        {
            return new GroupRemoval(CategoryOutcome.NotFound);
        }

        if (group.IsArchived)
        {
            return new GroupRemoval(CategoryOutcome.Done, Removal.Hidden);
        }

        if (ShownGroups(group.Kind).Count <= 1)
        {
            return new GroupRemoval(CategoryOutcome.LastOfKind);
        }

        var its = CategoriesOf(group.Id);
        if (its.Any(category => !category.IsArchived))
        {
            return new GroupRemoval(CategoryOutcome.StillHasCategories);
        }

        if (its.Count == 0)
        {
            groups.Remove(group);
            RenumberGroups(Ordered());
            return new GroupRemoval(CategoryOutcome.Done, Removal.Deleted, group);
        }

        group.IsArchived = true;
        return new GroupRemoval(CategoryOutcome.Done, Removal.Hidden);
    }

    /// <summary>Shows a hidden group again where it was.</summary>
    public GroupChange RestoreGroup(Guid groupId)
    {
        var group = FindGroup(groupId);
        if (group is null)
        {
            return new GroupChange(CategoryOutcome.NotFound);
        }

        group.IsArchived = false;
        return new GroupChange(CategoryOutcome.Done, group);
    }

    /// <summary>Whether two names are the same name: spaces around them and case don't count, in any alphabet.</summary>
    public static bool SameName(string saved, string typed) =>
        string.Equals(saved.Trim(), typed.Trim(), StringComparison.OrdinalIgnoreCase);

    private static int KindOrder(CategoryKind kind) => kind == CategoryKind.Income ? 0 : 1;

    private CategoryGroup? FindGroup(Guid groupId) => groups.Find(group => group.Id == groupId);

    private Category? FindCategory(Guid categoryId) => categories.Find(category => category.Id == categoryId);

    private CategoryOutcome CategoryNameClash(Guid groupId, string name, Guid? except)
    {
        var twin = categories.Find(category =>
            category.GroupId == groupId && category.Id != except && SameName(category.Name, name));
        return twin is null ? CategoryOutcome.Done
            : twin.IsArchived ? CategoryOutcome.NameTakenByHidden
            : CategoryOutcome.NameTaken;
    }

    private bool GroupNameClash(string name, Guid? except) =>
        groups.Exists(group => group.Id != except && SameName(group.Name, name));

    /// <summary>Puts a shown category at a place among the group's other shown ones (the end when null).</summary>
    private void PlaceCategory(Category category, int? place)
    {
        var shown = categories
            .Where(other => other.GroupId == category.GroupId && !other.IsArchived && other.Id != category.Id)
            .OrderBy(other => other.SortOrder)
            .ToList();
        shown.Insert(Math.Clamp(place ?? shown.Count, 0, shown.Count), category);
        var hidden = categories
            .Where(other => other.GroupId == category.GroupId && other.IsArchived)
            .OrderBy(other => other.SortOrder);
        Number([.. shown, .. hidden]);
    }

    private void Renumber(CategoryGroup group) => Number(CategoriesOf(group.Id));

    private static void Number(IEnumerable<Category> ordered)
    {
        var order = 1;
        foreach (var category in ordered)
        {
            category.SortOrder = order++;
        }
    }

    private List<CategoryGroup> ShownGroups(CategoryKind kind) =>
        [.. Ordered().Where(group => group.Kind == kind && !group.IsArchived)];

    /// <summary>All groups in order, the one being placed left where it was (a new one last of its kind).</summary>
    private List<CategoryGroup> Ordered() =>
        [.. groups.OrderBy(group => KindOrder(group.Kind))
            .ThenBy(group => group.SortOrder == 0 ? int.MaxValue : group.SortOrder)];

    /// <summary>Puts a group before the shown group of its kind now at <paramref name="place"/> (after its kind when none).</summary>
    private void PlaceGroup(CategoryGroup group, int? place)
    {
        var rest = Ordered();
        rest.Remove(group);
        var shown = rest.Where(other => other.Kind == group.Kind && !other.IsArchived).ToList();
        var before = shown.ElementAtOrDefault(place ?? shown.Count);
        var at = before is not null
            ? rest.IndexOf(before)
            : rest.FindLastIndex(other => KindOrder(other.Kind) <= KindOrder(group.Kind)) + 1;
        rest.Insert(at, group);
        RenumberGroups(rest);
    }

    private static void RenumberGroups(IEnumerable<CategoryGroup> ordered)
    {
        var order = 1;
        foreach (var group in ordered)
        {
            group.SortOrder = order++;
        }
    }
}
