using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Tests.Categories;

/// <summary>What the Categories page gets from a person's groups (F-015).</summary>
public sealed class CategoriesOverviewTests
{
    private static readonly Guid Olena = Guid.CreateVersion7();

    private static string Line(CategoryGroupItem group) =>
        $"{group.Name} ({group.Kind}): " + string.Join(", ", group.Categories.Select(category => category.Name));

    private static CategoryGroup Group(string name) =>
        new() { Id = Guid.CreateVersion7(), UserId = Olena, Name = name, Kind = CategoryKind.Expense, SortOrder = 1 };

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
        var overview = CategoriesOverview.From(DefaultCategories.CreateFor(Olena).Reverse());

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

        CategoriesOverview.From([health]).Groups.Single().Categories.Select(category => category.Name)
            .Should().Equal("Doctor/Dentist", "Therapy");
    }

    [Fact]
    public void Archived_categories_are_left_out_and_ids_are_kept()
    {
        var subscriptions = Group("Subscriptions");
        var phone = Add(subscriptions, "Phone", 1);
        Add(subscriptions, "Spotify", 2, isArchived: true);

        var item = CategoriesOverview.From([subscriptions]).Groups.Single();

        item.Id.Should().Be(subscriptions.Id);
        item.Categories.Should().Equal(new CategoryItem(phone.Id, "Phone"));
    }

    [Fact]
    public void A_person_without_groups_gets_an_empty_list()
    {
        CategoriesOverview.From([]).Groups.Should().BeEmpty();
    }
}
