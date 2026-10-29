using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Domain.Tests.Categories;

/// <summary>The default set every new person gets (F-013, PRODUCT.md "Default categories").</summary>
public sealed class DefaultCategoriesTests
{
    private static readonly Guid Olena = Guid.CreateVersion7();

    [Fact]
    public void It_has_the_spreadsheet_groups_and_categories_in_their_order()
    {
        var groups = DefaultCategories.CreateFor(Olena);

        groups.OrderBy(group => group.SortOrder).Select(group =>
                $"{group.Name} ({group.Kind}): " + string.Join(", ",
                    group.Categories.OrderBy(category => category.SortOrder).Select(category => category.Name)))
            .Should().Equal(
                "Income (Income): Salary, Gifts, Other",
                "Home expenses (Expense): Rent, Bills, Home supplies, Electronics, Bank commission, Gifts, Tax, Delivery, Other",
                "Daily living (Expense): Groceries, Clothing, Eating out, Transportation, Salon/Barber, Sport",
                "Health (Expense): Doctor/Dentist, Medicine/Drugs/Skincare, Emergency, Therapy",
                "Education (Expense): English lessons, Piano lessons, Driving",
                "Entertainment (Expense): Activities, Books, Games, Hobbies, Vacation",
                "Subscriptions (Expense): Spotify, Phone, Subscriptions");
    }

    [Fact]
    public void Emergency_is_under_health()
    {
        var groups = DefaultCategories.CreateFor(Olena);

        groups.Where(group => group.Categories.Any(category => category.Name == "Emergency"))
            .Select(group => group.Name)
            .Should().Equal("Health");
    }

    [Fact]
    public void Sort_orders_count_from_one_without_gaps()
    {
        var groups = DefaultCategories.CreateFor(Olena);

        groups.Select(group => group.SortOrder).Should().Equal(Enumerable.Range(1, groups.Count));
        groups.Should().AllSatisfy(group =>
            group.Categories.Select(category => category.SortOrder)
                .Should().Equal(Enumerable.Range(1, group.Categories.Count)));
    }

    [Fact]
    public void The_copy_belongs_to_the_person_and_its_categories_to_their_groups()
    {
        var groups = DefaultCategories.CreateFor(Olena);

        groups.Should().AllSatisfy(group =>
        {
            group.UserId.Should().Be(Olena);
            group.Categories.Should().AllSatisfy(category => category.GroupId.Should().Be(group.Id));
        });
    }

    [Fact]
    public void Every_person_gets_a_fresh_copy_with_new_ids()
    {
        var first = DefaultCategories.CreateFor(Olena);
        var second = DefaultCategories.CreateFor(Guid.CreateVersion7());

        var ids = first.Concat(second)
            .SelectMany(group => group.Categories.Select(category => category.Id).Prepend(group.Id))
            .ToList();

        ids.Should().OnlyHaveUniqueItems().And.NotContain(Guid.Empty);
    }

    [Fact]
    public void Names_fit_the_database_and_are_unique_where_the_database_requires()
    {
        var groups = DefaultCategories.CreateFor(Olena);

        groups.Select(group => group.Name).Should().OnlyHaveUniqueItems()
            .And.AllSatisfy(name => name.Length.Should().BeLessThanOrEqualTo(CategoryGroup.NameMaxLength));
        groups.Should().AllSatisfy(group =>
            group.Categories.Select(category => category.Name).Should().OnlyHaveUniqueItems()
                .And.AllSatisfy(name => name.Length.Should().BeLessThanOrEqualTo(Category.NameMaxLength)));
    }
}
