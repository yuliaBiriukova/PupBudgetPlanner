namespace PupBudgetPlanner.Domain.Categories;

/// <summary>A row in the report (Groceries, Rent, …) that classifies expenses or incomes. Belongs to one group.</summary>
public sealed class Category
{
    public const int NameMaxLength = 50;

    public Guid Id { get; init; }

    public Guid GroupId { get; set; }

    public required string Name { get; set; }

    /// <summary>Position inside the group, from 1.</summary>
    public int SortOrder { get; set; }

    /// <summary>Hidden from the forms but kept for the transactions and reports that use it.</summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// The other members of the family see nothing of it (F-030): not the category, its transactions or its total.
    /// </summary>
    public bool IsPrivate { get; set; }
}
