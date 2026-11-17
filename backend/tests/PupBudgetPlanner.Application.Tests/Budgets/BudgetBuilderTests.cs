using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Tests.Budgets;

public sealed class BudgetBuilderTests
{
    private static readonly DateOnly November = new(2026, 11, 1);
    private static readonly DateOnly November2 = new(2026, 11, 2);
    private static readonly DateOnly November3 = new(2026, 11, 3);
    private static readonly Guid Person = Guid.CreateVersion7();

    private static readonly Category Food = new() { Id = Guid.CreateVersion7(), Name = "Food", SortOrder = 1 };
    private static readonly Category EatingOut = new() { Id = Guid.CreateVersion7(), Name = "Eating out", SortOrder = 2 };
    private static readonly Category OldCafe =
        new() { Id = Guid.CreateVersion7(), Name = "Old cafe", SortOrder = 3, IsArchived = true };
    private static readonly Category Spotify = new() { Id = Guid.CreateVersion7(), Name = "Spotify", SortOrder = 1 };
    private static readonly Category Salary = new() { Id = Guid.CreateVersion7(), Name = "Salary", SortOrder = 1 };

    private static readonly CategoryGroup Income = GroupOf("Income", CategoryKind.Income, 1, Salary);
    private static readonly CategoryGroup DailyLiving = GroupOf("Daily living", CategoryKind.Expense, 2, Food, EatingOut, OldCafe);
    private static readonly CategoryGroup Subscriptions = GroupOf("Subscriptions", CategoryKind.Expense, 3, Spotify);

    private static readonly CategoryGroup[] Groups = [Income, Subscriptions, DailyLiving];

    /// <summary>A dollar is 41.5 ₴ on the 2nd; the 3rd has no rates.</summary>
    private static readonly Dictionary<DateOnly, IReadOnlyDictionary<string, decimal>> Rates = new()
    {
        [November2] = new Dictionary<string, decimal> { ["USD"] = 41.5m },
    };

    private static CategoryGroup GroupOf(string name, CategoryKind kind, int order, params Category[] categories)
    {
        var group = new CategoryGroup { Id = Guid.CreateVersion7(), Name = name, Kind = kind, SortOrder = order };
        foreach (var category in categories)
        {
            category.GroupId = group.Id;
            group.Categories.Add(category);
        }

        return group;
    }

    private static BudgetMonth Planned()
    {
        var plan = BudgetMonth.Start(Person, November, DateTimeOffset.UnixEpoch);
        plan.SetTotal(30_000);
        plan.SetGroup(DailyLiving.Id, 20_000);
        plan.SetCategory(Food.Id, 12_000);
        return plan;
    }

    [Fact]
    public void Spent_is_in_the_report_currency_at_each_days_rate_per_category_group_and_month()
    {
        var spending = new BudgetSpending[]
        {
            new(November2, "UAH", Food.Id, 1_000),
            new(November2, "USD", Spotify.Id, 10),
            new(November2, "UAH", EatingOut.Id, 400),
        };

        var budget = BudgetBuilder.Build(November, "UAH", Groups, Planned(), null, spending, Rates);

        budget.Month.Should().Be("2026-11");
        budget.Planned.Should().BeTrue();
        budget.StartFrom.Should().BeNull();
        budget.Total.Should().Be(30_000);
        budget.Spent.Should().Be(1_000 + 415 + 400);
        budget.RatesMissing.Should().BeFalse();

        // Expense groups only, in their order; a group's spending counts all its categories, with a budget or not
        budget.Groups.Select(group => group.Name).Should().Equal("Daily living", "Subscriptions");
        var daily = budget.Groups[0];
        daily.Budget.Should().Be(20_000);
        daily.Spent.Should().Be(1_400);
        daily.Categories.Should().Equal(
            new BudgetCategoryLine(Food.Id, "Food", 12_000, 1_000),
            new BudgetCategoryLine(EatingOut.Id, "Eating out", null, 400));
        budget.Groups[1].Budget.Should().BeNull();
        budget.Groups[1].Spent.Should().Be(415);
    }

    [Fact]
    public void A_hidden_category_shows_only_with_a_budget_or_spending()
    {
        var spending = new BudgetSpending[] { new(November2, "UAH", OldCafe.Id, 90) };

        var budget = BudgetBuilder.Build(November, "UAH", Groups, Planned(), null, spending, Rates);

        budget.Groups[0].Categories.Select(category => category.Name).Should().Equal("Food", "Eating out", "Old cafe");
        BudgetBuilder.Build(November, "UAH", Groups, Planned(), null, [], Rates)
            .Groups[0].Categories.Select(category => category.Name).Should().Equal("Food", "Eating out");
    }

    [Fact]
    public void Spending_without_a_rate_is_left_out_and_said_so()
    {
        var spending = new BudgetSpending[] { new(November3, "USD", Spotify.Id, 10), new(November3, "UAH", Food.Id, 50) };

        var budget = BudgetBuilder.Build(November, "UAH", Groups, Planned(), null, spending, Rates);

        budget.Spent.Should().Be(50);
        budget.RatesMissing.Should().BeTrue();
    }

    [Fact]
    public void A_month_not_planned_has_no_amounts_and_names_the_last_planned_one()
    {
        var budget = BudgetBuilder.Build(
            November, "UAH", Groups, null, new DateOnly(2026, 10, 1), [new(November2, "UAH", Food.Id, 70)], Rates);

        budget.Planned.Should().BeFalse();
        budget.StartFrom.Should().Be("2026-10");
        budget.Total.Should().BeNull();
        budget.Spent.Should().Be(70);
        budget.Groups.SelectMany(group => group.Categories).Should().OnlyContain(category => category.Budget == null);
        budget.Groups.Should().OnlyContain(group => group.Budget == null);
    }

    [Fact]
    public void The_rules_check_every_expense_group_with_every_category_hidden_ones_too()
    {
        var shapes = BudgetBuilder.ShapesOf(Groups);

        shapes.Select(shape => shape.Id).Should().BeEquivalentTo([DailyLiving.Id, Subscriptions.Id]);
        shapes.Single(shape => shape.Id == DailyLiving.Id).CategoryIds
            .Should().BeEquivalentTo([Food.Id, EatingOut.Id, OldCafe.Id]);
    }
}
