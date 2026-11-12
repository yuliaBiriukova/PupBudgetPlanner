using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Tests.Categories;

/// <summary>What the Categories page and the quick-add form get from a person's groups (F-015, F-029).</summary>
public sealed class CategoriesOverviewTests
{
    private static readonly Guid Olena = Guid.CreateVersion7();
    private static readonly Dictionary<Guid, int> NoTransactions = [];

    private static string Line(CategoryGroupItem group) =>
        $"{group.Name} ({group.Kind}): " + string.Join(", ", group.Categories.Select(category => category.Name));

    private static CategoryGroup Group(string name, CategoryKind kind = CategoryKind.Expense, int sortOrder = 1) =>
        new() { Id = Guid.CreateVersion7(), UserId = Olena, Name = name, Kind = kind, SortOrder = sortOrder };

    private static Category Add(CategoryGroup group, string name, int sortOrder, bool isArchived = false)
    {
        var category = new Category
        {
            Id = Guid.CreateVersion7(),
            GroupId = group.Id,
            Name = name,
            SortOrder = sortOrder,
            IsArchived = isArchived,
        };
        group.Categories.Add(category);
        return category;
    }

    [Fact]
    public void The_default_set_comes_in_the_reports_order()
    {
        var overview = CategoriesOverview.From(Olena, DefaultCategories.CreateFor(Olena).Reverse(), NoTransactions);

        overview.Groups.Select(Line).Should().Equal(
            "Income (Income): Salary, Gifts, Other",
            "Home expenses (Expense): Rent, Bills, Home supplies, Electronics, Bank commission, Gifts, Tax, " +
            "Delivery, Other",
            "Daily living (Expense): Groceries, Clothing, Eating out, Transportation, Salon/Barber, Sport",
            "Health (Expense): Doctor/Dentist, Medicine/Drugs/Skincare, Emergency, Therapy",
            "Education (Expense): English lessons, Piano lessons, Driving",
            "Entertainment (Expense): Activities, Books, Games, Hobbies, Vacation",
            "Subscriptions (Expense): Spotify, Phone, Subscriptions");
    }

    [Fact]
    public void Categories_follow_their_sort_order_not_the_order_they_were_loaded_in()
    {
        var health = Group("Health");
        Add(health, "Therapy", 2);
        Add(health, "Doctor/Dentist", 1);

        CategoriesOverview.From(Olena, [health], NoTransactions).Groups.Single().Categories
            .Select(category => category.Name).Should().Equal("Doctor/Dentist", "Therapy");
    }

    [Fact]
    public void Income_groups_come_first_whatever_their_sort_order()
    {
        var home = Group("Home", sortOrder: 1);
        var salary = Group("Salary", CategoryKind.Income, sortOrder: 2);

        CategoriesOverview.From(Olena, [home, salary], NoTransactions).Groups.Select(group => group.Name)
            .Should().Equal("Salary", "Home");
    }

    [Fact]
    public void Hidden_categories_and_groups_come_marked_after_the_shown_ones_with_the_transaction_counts()
    {
        var subscriptions = Group("Subscriptions");
        var netflix = Add(subscriptions, "Netflix", 1, isArchived: true);
        var phone = Add(subscriptions, "Phone", 2);
        var old = Group("Old", sortOrder: 2);
        old.IsArchived = true;

        var overview = CategoriesOverview.From(
            Olena, [subscriptions, old], new Dictionary<Guid, int> { [netflix.Id] = 9 });

        overview.Groups[0].Should().BeEquivalentTo(new CategoryGroupItem(
            subscriptions.Id,
            "Subscriptions",
            CategoryKind.Expense,
            false,
            [new CategoryItem(phone.Id, "Phone", false, 0), new CategoryItem(netflix.Id, "Netflix", true, 9)],
            false),
            options => options.WithStrictOrdering());
        overview.Groups[1].IsHidden.Should().BeTrue();
    }

    [Fact]
    public void A_person_without_groups_gets_an_empty_list()
    {
        CategoriesOverview.From(Olena, [], NoTransactions).Groups.Should().BeEmpty();
    }
}
