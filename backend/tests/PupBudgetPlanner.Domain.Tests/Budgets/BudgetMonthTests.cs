using PupBudgetPlanner.Domain.Budgets;

namespace PupBudgetPlanner.Domain.Tests.Budgets;

public sealed class BudgetMonthTests
{
    private static readonly Guid Person = Guid.CreateVersion7();
    private static readonly Guid Group = Guid.CreateVersion7();
    private static readonly Guid Category = Guid.CreateVersion7();
    private static readonly DateTimeOffset Now = new(2026, 11, 1, 7, 0, 0, TimeSpan.Zero);

    [Fact]
    public void A_month_is_kept_by_its_first_day()
    {
        var month = BudgetMonth.Start(Person, new DateOnly(2026, 11, 17), Now);

        month.Month.Should().Be(new DateOnly(2026, 11, 1));
        month.Total.Should().BeNull();
        month.Groups.Should().BeEmpty();
        month.Categories.Should().BeEmpty();
    }

    [Fact]
    public void A_new_month_started_from_the_last_has_all_three_levels_of_it()
    {
        var october = BudgetMonth.Start(Person, new DateOnly(2026, 10, 1), Now);
        october.SetTotal(50_000);
        october.SetGroup(Group, 22_000);
        october.SetCategory(Category, 13_000);

        var november = BudgetMonth.Start(Person, new DateOnly(2026, 11, 1), Now, october);

        november.Plan.Total.Should().Be(50_000);
        november.Plan.Groups.Should().Equal(new Dictionary<Guid, decimal> { [Group] = 22_000 });
        november.Plan.Categories.Should().Equal(new Dictionary<Guid, decimal> { [Category] = 13_000 });
        november.Groups.Should().OnlyContain(group => group.BudgetMonthId == november.Id);
    }

    [Fact]
    public void Amounts_are_whole_and_none_removes_a_budget()
    {
        var month = BudgetMonth.Start(Person, new DateOnly(2026, 11, 1), Now);
        month.SetTotal(49_999.5m);
        month.SetGroup(Group, 100.4m);
        month.SetCategory(Category, 10);
        month.SetCategory(Category, 20);

        month.Total.Should().Be(50_000);
        month.Plan.Groups[Group].Should().Be(100);
        month.Plan.Categories[Category].Should().Be(20);

        month.SetTotal(null);
        month.SetGroup(Group, null);
        month.SetCategory(Category, null);
        month.Total.Should().BeNull();
        month.Groups.Should().BeEmpty();
        month.Categories.Should().BeEmpty();
    }
}
