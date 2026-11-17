using PupBudgetPlanner.Domain.Budgets;

namespace PupBudgetPlanner.Domain.Tests.Budgets;

public sealed class BudgetPlanTests
{
    private static readonly Guid DailyLiving = Guid.CreateVersion7();
    private static readonly Guid Food = Guid.CreateVersion7();
    private static readonly Guid EatingOut = Guid.CreateVersion7();
    private static readonly Guid Subscriptions = Guid.CreateVersion7();
    private static readonly Guid Spotify = Guid.CreateVersion7();

    private static readonly BudgetGroupShape[] Groups =
    [
        new(DailyLiving, [Food, EatingOut]),
        new(Subscriptions, [Spotify]),
    ];

    private static BudgetPlan Plan(
        decimal? total = null,
        Dictionary<Guid, decimal>? groups = null,
        Dictionary<Guid, decimal>? categories = null) =>
        new(total, groups ?? [], categories ?? []);

    [Fact]
    public void Categories_within_their_groups_budget_and_groups_within_the_total_fit()
    {
        // The owner's example: Daily living 15 000 with Food 10 000 and Eating out 3 000 is fine
        var plan = Plan(
            total: 20_000,
            groups: new() { [DailyLiving] = 15_000 },
            categories: new() { [Food] = 10_000, [EatingOut] = 3_000, [Spotify] = 500 });

        plan.Overflows(Groups).Should().BeEmpty();
    }

    [Fact]
    public void Categories_adding_up_to_more_than_their_groups_own_budget_go_over_by_the_difference()
    {
        // Eating out 6 000 is not
        var plan = Plan(groups: new() { [DailyLiving] = 15_000 }, categories: new() { [Food] = 10_000, [EatingOut] = 6_000 });

        var overflow = plan.Overflows(Groups).Should().ContainSingle().Subject;
        overflow.GroupId.Should().Be(DailyLiving);
        overflow.Inside.Should().Be(16_000);
        overflow.Budget.Should().Be(15_000);
        overflow.Over.Should().Be(1_000);
        overflow.IsTotal.Should().BeFalse();
    }

    [Fact]
    public void A_group_without_its_own_budget_counts_in_the_total_with_its_categories_sum()
    {
        var plan = Plan(
            total: 15_500,
            groups: new() { [DailyLiving] = 15_000 },
            categories: new() { [Food] = 10_000, [Spotify] = 700 });

        plan.TakenBy(Groups[1]).Should().Be(700);
        var overflow = plan.Overflows(Groups).Should().ContainSingle().Subject;
        overflow.IsTotal.Should().BeTrue();
        overflow.Inside.Should().Be(15_700);
        overflow.Over.Should().Be(200);
    }

    [Fact]
    public void A_group_with_its_own_budget_takes_that_of_the_total_not_its_categories_sum()
    {
        var plan = Plan(total: 15_000, groups: new() { [DailyLiving] = 15_000 }, categories: new() { [Food] = 2_000 });

        plan.TakenBy(Groups[0]).Should().Be(15_000);
        plan.Overflows(Groups).Should().BeEmpty();
    }

    [Fact]
    public void Without_a_total_the_groups_can_add_up_to_anything()
    {
        var plan = Plan(groups: new() { [DailyLiving] = 90_000 }, categories: new() { [Spotify] = 70_000 });

        plan.Overflows(Groups).Should().BeEmpty();
    }

    [Fact]
    public void Lowering_a_groups_budget_below_its_categories_is_worse_than_before()
    {
        var before = Plan(groups: new() { [DailyLiving] = 15_000 }, categories: new() { [Food] = 10_000 });
        var after = Plan(groups: new() { [DailyLiving] = 9_000 }, categories: new() { [Food] = 10_000 });

        after.WorseThan(before, Groups).Should().BeEquivalentTo(new BudgetOverflow(DailyLiving, 10_000, 9_000));
    }

    [Fact]
    public void Lowering_the_total_below_the_groups_is_worse_than_before()
    {
        var before = Plan(total: 20_000, groups: new() { [DailyLiving] = 15_000 });
        var after = Plan(total: 10_000, groups: new() { [DailyLiving] = 15_000 });

        after.WorseThan(before, Groups)!.IsTotal.Should().BeTrue();
    }

    [Fact]
    public void A_plan_already_over_can_be_put_right_one_line_at_a_time()
    {
        // A category moved into the group (F-029) left it 3 000 over: lowering it by 1 000 makes it better, not worse
        var before = Plan(groups: new() { [DailyLiving] = 10_000 }, categories: new() { [Food] = 10_000, [EatingOut] = 3_000 });
        var after = Plan(groups: new() { [DailyLiving] = 10_000 }, categories: new() { [Food] = 10_000, [EatingOut] = 2_000 });

        after.WorseThan(before, Groups).Should().BeNull();
    }

    [Fact]
    public void A_change_elsewhere_doesnt_answer_for_a_level_already_over_by_as_much()
    {
        var before = Plan(groups: new() { [DailyLiving] = 10_000 }, categories: new() { [Food] = 11_000 });
        var after = Plan(groups: new() { [DailyLiving] = 10_000 }, categories: new() { [Food] = 11_000, [Spotify] = 300 });

        after.WorseThan(before, Groups).Should().BeNull();
    }
}
