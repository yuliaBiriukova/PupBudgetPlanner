namespace PupBudgetPlanner.Domain.Categories;

/// <summary>
/// The groups and categories every new person starts with, in the spreadsheet's order (PRODUCT.md "Default
/// categories"). Several are the owner's own; a generic set for other people is planned after the MVP (Q-011).
/// </summary>
public static class DefaultCategories
{
    private static readonly (string Name, CategoryKind Kind, string[] Categories)[] Groups =
    [
        ("Income", CategoryKind.Income, ["Salary", "Gifts", "Other"]),
        ("Home expenses", CategoryKind.Expense,
            ["Rent", "Bills", "Home supplies", "Electronics", "Bank commission", "Gifts", "Tax", "Delivery", "Other"]),
        ("Daily living", CategoryKind.Expense,
            ["Groceries", "Clothing", "Eating out", "Transportation", "Salon/Barber", "Sport"]),
        ("Health", CategoryKind.Expense, ["Doctor/Dentist", "Medicine/Drugs/Skincare", "Emergency", "Therapy"]),
        ("Education", CategoryKind.Expense, ["English lessons", "Piano lessons", "Driving"]),
        ("Entertainment", CategoryKind.Expense, ["Activities", "Books", "Games", "Hobbies", "Vacation"]),
        ("Subscriptions", CategoryKind.Expense, ["Spotify", "Phone", "Subscriptions"]),
    ];

    /// <summary>A fresh copy of the default set owned by <paramref name="userId"/>, with new ids.</summary>
    public static IReadOnlyList<CategoryGroup> CreateFor(Guid userId) =>
        Groups.Select((group, groupIndex) =>
        {
            var created = new CategoryGroup
            {
                Id = Guid.CreateVersion7(),
                UserId = userId,
                Name = group.Name,
                Kind = group.Kind,
                SortOrder = groupIndex + 1,
            };

            for (var index = 0; index < group.Categories.Length; index++)
            {
                created.Categories.Add(new Category
                {
                    Id = Guid.CreateVersion7(),
                    GroupId = created.Id,
                    Name = group.Categories[index],
                    SortOrder = index + 1,
                });
            }

            return created;
        }).ToList();
}
