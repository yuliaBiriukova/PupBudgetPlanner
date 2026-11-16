namespace PupBudgetPlanner.Domain.Categories;

/// <summary>
/// The groups and categories every new person starts with (PRODUCT.md "Default categories"): a generic set agreed
/// with the owner in F-032, every group ending with "Other". People who signed up before F-032 keep the
/// spreadsheet's set they got then.
/// </summary>
public static class DefaultCategories
{
    private static readonly (string Name, CategoryKind Kind, string[] Categories)[] Groups =
    [
        ("Income", CategoryKind.Income, ["Salary", "Side income", "Gifts", "Other"]),
        ("Home expenses", CategoryKind.Expense,
            ["Rent", "Bills", "Home supplies", "Electronics", "Bank fees", "Tax", "Delivery", "Services", "Other"]),
        ("Daily living", CategoryKind.Expense,
            ["Food", "Toiletries", "Clothing", "Eating out", "Transportation", "Self-care", "Sport", "Gifts", "Other"]),
        ("Car", CategoryKind.Expense, ["Fuel", "Parking", "Service & repairs", "Insurance", "Other"]),
        ("Health", CategoryKind.Expense, ["Doctor/Dentist", "Medicine", "Therapy", "Other"]),
        ("Entertainment", CategoryKind.Expense, ["Activities", "Books", "Games", "Hobbies", "Vacation", "Other"]),
        ("Subscriptions", CategoryKind.Expense, ["Music & streaming", "Phone", "Software", "Other"]),
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
