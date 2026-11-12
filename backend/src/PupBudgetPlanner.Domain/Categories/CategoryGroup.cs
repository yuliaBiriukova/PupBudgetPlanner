namespace PupBudgetPlanner.Domain.Categories;

/// <summary>A top-level group of one person's categories (Income, Daily living, …): a section of the report.</summary>
public sealed class CategoryGroup
{
    public const int NameMaxLength = 50;

    public Guid Id { get; init; }

    /// <summary>The person the group belongs to: categories are personal.</summary>
    public Guid UserId { get; init; }

    public required string Name { get; set; }

    public CategoryKind Kind { get; init; }

    /// <summary>Position among the person's groups, from 1.</summary>
    public int SortOrder { get; set; }

    /// <summary>Hidden with its hidden categories (F-029): kept for the transactions and reports that use them.</summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// The other members of the family see nothing of the group (F-030): its categories, the ones added later too, their
    /// transactions and totals.
    /// </summary>
    public bool IsPrivate { get; set; }

    public ICollection<Category> Categories { get; } = [];
}
