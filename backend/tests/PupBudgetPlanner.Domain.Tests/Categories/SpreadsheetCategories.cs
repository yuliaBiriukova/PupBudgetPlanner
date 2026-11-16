using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Domain.Tests.Categories;

/// <summary>
/// The spreadsheet's set of groups and categories, the default for new people until F-032: test data for the tests of
/// a person's categories and of the spreadsheet's report, which accounts made before F-032 still have. Also compiled
/// into the Application tests (linked in their project file).
/// </summary>
public static class SpreadsheetCategories
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

    /// <summary>A fresh copy of the set owned by <paramref name="userId"/>, with new ids.</summary>
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
