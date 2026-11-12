using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Application.Reports;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Categories;

/// <summary>The family's categories as one set (F-024, open point 5).</summary>
public sealed class FamilyCategoriesTests
{
    private static readonly Guid Olena = Guid.CreateVersion7();
    private static readonly Guid Andriy = Guid.CreateVersion7();
    private static readonly Guid Stranger = Guid.CreateVersion7();

    private static CategoryGroup Group(
        Guid userId, string name, CategoryKind kind, int order, params string[] categories)
    {
        var group = new CategoryGroup
        {
            Id = Guid.CreateVersion7(), UserId = userId, Name = name, Kind = kind, SortOrder = order,
        };
        for (var index = 0; index < categories.Length; index++)
        {
            group.Categories.Add(new Category
            {
                Id = Guid.CreateVersion7(), GroupId = group.Id, Name = categories[index], SortOrder = index + 1,
            });
        }

        return group;
    }

    private static Guid IdOf(CategoryGroup group, string category) =>
        group.Categories.Single(item => item.Name == category).Id;

    private static IEnumerable<string> NamesOf(CategoryGroup group) =>
        group.Categories.OrderBy(category => category.SortOrder).Select(category => category.Name);

    [Fact]
    public void Groups_and_categories_of_the_same_kind_and_name_are_one_ignoring_case_and_end_spaces()
    {
        var olenasDaily = Group(Olena, "Daily living", CategoryKind.Expense, 2, "Groceries", "Eating out");
        var andriysDaily = Group(Andriy, " daily LIVING ", CategoryKind.Expense, 1, "groceries ", "Coffee");

        var merged = FamilyCategories.Of([Olena, Andriy], [andriysDaily, olenasDaily]);

        var daily = merged.Groups.Should().ContainSingle().Subject;
        daily.Id.Should().Be(olenasDaily.Id);
        daily.Name.Should().Be("Daily living");
        NamesOf(daily).Should().Equal("Groceries", "Eating out", "Coffee");
        merged.MergedIdOf(IdOf(andriysDaily, "groceries ")).Should().Be(IdOf(olenasDaily, "Groceries"));
        merged.MergedIdOf(IdOf(andriysDaily, "Coffee")).Should().Be(IdOf(andriysDaily, "Coffee"));
        merged.SameAs(IdOf(olenasDaily, "Groceries")).Should()
            .BeEquivalentTo([IdOf(olenasDaily, "Groceries"), IdOf(andriysDaily, "groceries ")]);
        merged.SameAs(IdOf(andriysDaily, "groceries ")).Should().HaveCount(2);
    }

    [Fact]
    public void The_viewers_groups_come_first_in_their_order_and_only_someone_elses_follow()
    {
        var olenasIncome = Group(Olena, "Income", CategoryKind.Income, 1, "Salary");
        var olenasHome = Group(Olena, "Home", CategoryKind.Expense, 2, "Rent");
        var andriysCar = Group(Andriy, "Car", CategoryKind.Expense, 1, "Fuel");
        var andriysHome = Group(Andriy, "Home", CategoryKind.Expense, 2, "Rent", "Repairs");
        var andriysIncome = Group(Andriy, "Income", CategoryKind.Income, 3, "Salary", "Bonus");

        var merged = FamilyCategories.Of([Olena, Andriy], [andriysCar, andriysHome, andriysIncome, olenasHome, olenasIncome]);

        merged.Groups.Select(group => group.Name).Should().Equal("Income", "Home", "Car");
        merged.Groups.Select(group => group.SortOrder).Should().Equal(1, 2, 3);
        NamesOf(merged.Groups[0]).Should().Equal("Salary", "Bonus");
        NamesOf(merged.Groups[1]).Should().Equal("Rent", "Repairs");
    }

    [Fact]
    public void An_income_and_an_expense_group_of_one_name_stay_apart()
    {
        var olenasOther = Group(Olena, "Other", CategoryKind.Income, 1, "Gifts");
        var andriysOther = Group(Andriy, "Other", CategoryKind.Expense, 1, "Gifts");

        var merged = FamilyCategories.Of([Olena, Andriy], [olenasOther, andriysOther]);

        merged.Groups.Should().HaveCount(2);
        merged.MergedIdOf(IdOf(andriysOther, "Gifts")).Should().Be(IdOf(andriysOther, "Gifts"));
    }

    [Fact]
    public void A_merged_category_is_hidden_only_when_every_part_of_it_is()
    {
        var olenas = Group(Olena, "Home", CategoryKind.Expense, 1, "Rent", "Garden");
        var andriys = Group(Andriy, "Home", CategoryKind.Expense, 1, "Rent", "Garden");
        olenas.Categories.Single(c => c.Name == "Rent").IsArchived = true;
        olenas.Categories.Single(c => c.Name == "Garden").IsArchived = true;
        andriys.Categories.Single(c => c.Name == "Garden").IsArchived = true;
        andriys.IsArchived = true;

        var home = FamilyCategories.Of([Olena, Andriy], [olenas, andriys]).Groups.Single();

        home.IsArchived.Should().BeFalse();
        home.Categories.Single(c => c.Name == "Rent").IsArchived.Should().BeFalse();
        home.Categories.Single(c => c.Name == "Garden").IsArchived.Should().BeTrue();
    }

    [Fact]
    public void Only_the_people_asked_for_count()
    {
        var olenas = Group(Olena, "Home", CategoryKind.Expense, 1, "Rent");
        var strangers = Group(Stranger, "Secret", CategoryKind.Expense, 1, "Hidden");

        var merged = FamilyCategories.Of([Olena], [olenas, strangers]);

        merged.Groups.Should().ContainSingle().Which.Name.Should().Be("Home");
        merged.Names().Should().ContainSingle().Which.Value.Should().Be("Rent");
    }

    [Fact]
    public void The_familys_report_counts_a_members_expense_in_the_merged_category()
    {
        // Olena's and Andriy's Groceries are one row of the family's report: both of their October amounts in it
        var olenas = Group(Olena, "Daily living", CategoryKind.Expense, 1, "Groceries");
        var andriys = Group(Andriy, "Daily Living", CategoryKind.Expense, 1, "Groceries", "Coffee");
        var merged = FamilyCategories.Of([Olena, Andriy], [olenas, andriys]);
        var october = new DateOnly(2026, 10, 10);
        ReportAmount[] amounts =
        [
            new(october, TransactionType.Expense, "UAH", IdOf(olenas, "Groceries"), 1_000m),
            new(october, TransactionType.Expense, "UAH", IdOf(andriys, "Groceries"), 600m),
            new(october, TransactionType.Expense, "UAH", IdOf(andriys, "Coffee"), 90m),
        ];

        var report = ReportBuilder.Build(
            ReportPeriod.Month(2026, 10),
            "UAH",
            new DateOnly(2026, 11, 4),
            new ReportData(
                merged.Groups,
                [.. amounts.Select(amount => amount with { CategoryId = merged.MergedIdOf(amount.CategoryId) })],
                [],
                [],
                october),
            new Dictionary<DateOnly, PupBudgetPlanner.Application.ExchangeRates.DayRates>());

        var daily = report.Groups.Should().ContainSingle().Subject;
        daily.Categories.Select(category => (category.Name, category.Amounts.Total))
            .Should().Equal(("Groceries", 1_600m), ("Coffee", 90m));
        report.Summary.Expenses.Total.Should().Be(1_690m);
    }
}
