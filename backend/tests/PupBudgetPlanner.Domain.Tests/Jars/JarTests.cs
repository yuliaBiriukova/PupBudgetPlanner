using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Jars;

namespace PupBudgetPlanner.Domain.Tests.Jars;

public sealed class JarTests
{
    private static readonly Guid Person = Guid.CreateVersion7();
    private static readonly Guid Deposit = Guid.CreateVersion7();
    private static readonly Guid MonoBlack = Guid.CreateVersion7();
    private static readonly Guid Dollars = Guid.CreateVersion7();
    private static readonly DateTimeOffset Now = new(2026, 11, 17, 9, 0, 0, TimeSpan.Zero);
    private static readonly DateOnly Today = new(2026, 11, 17);

    private static JarMove Move(Guid account, decimal amount, decimal? accountAmount = null) =>
        JarMove.Of(Guid.Empty, account, Today, JarMoveKind.PutIn, amount, accountAmount ?? amount, Now);

    [Fact]
    public void A_jar_keeps_a_trimmed_name_a_whole_goal_and_the_first_day_of_its_month()
    {
        var jar = Jar.Create(
            Person,
            new JarDetails("  Car ", JarIcon.Car, JarColor.Blue, "UAH", 399_999.6m, new DateOnly(2027, 12, 15), "  "),
            Now);

        jar.Name.Should().Be("Car");
        jar.Goal.Should().Be(400_000);
        jar.TargetMonth.Should().Be(new DateOnly(2027, 12, 1));
        jar.Note.Should().BeNull();
        jar.IsClosed.Should().BeFalse();
    }

    [Fact]
    public void A_closed_jar_keeps_the_moment_it_was_first_closed()
    {
        var jar = Jar.Create(Person, new JarDetails("Car", JarIcon.Car, JarColor.Blue, "UAH", null, null, null), Now);

        jar.Close(Now);
        jar.Close(Now.AddDays(1));

        jar.ClosedAt.Should().Be(Now);
        jar.IsClosed.Should().BeTrue();
    }

    [Fact]
    public void Saved_is_what_went_in_less_what_came_out()
    {
        JarMoney.SavedIn([Move(Deposit, 120_000), Move(MonoBlack, 22_000), Move(MonoBlack, -4_000)])
            .Should().Be(138_000);
    }

    [Fact]
    public void A_jars_money_lies_per_account_biggest_first_without_the_accounts_it_all_went_back_to()
    {
        var places = JarMoney.PlacesOf(
            [Move(MonoBlack, 22_000), Move(Deposit, 120_000), Move(MonoBlack, -4_000), Move(Dollars, 500), Move(Dollars, -500)]);

        places.Should().Equal(new JarPlace(Deposit, 120_000, 120_000), new JarPlace(MonoBlack, 18_000, 18_000));
    }

    [Fact]
    public void An_accounts_jar_money_is_in_its_own_currency()
    {
        // $100 went into a hryvnia jar as 4 135 ₴: the dollar account has $100 of it in jars
        var inJars = JarMoney.InJarsOf([Move(Dollars, 4_135, 100), Move(MonoBlack, 50_000)]);

        inJars.Should().BeEquivalentTo(new Dictionary<Guid, decimal> { [Dollars] = 100, [MonoBlack] = 50_000 });
    }

    [Fact]
    public void Taking_out_part_takes_its_share_of_the_account_amount_and_all_of_it_leaves_nothing()
    {
        // $300 went in as 12 405 ₴ at one rate
        var place = new JarPlace(Dollars, 12_405, 300);

        JarMoney.AccountShareOf(place, 4_135).Should().Be(100);
        JarMoney.AccountShareOf(place, 12_405).Should().Be(300);
    }

    [Fact]
    public void Moves_are_whole()
    {
        var move = JarMove.Of(Guid.Empty, Dollars, Today, JarMoveKind.PutIn, 4_135.4m, 99.5m, Now);

        move.Amount.Should().Be(4_135);
        move.AccountAmount.Should().Be(100);
    }

    [Fact]
    public void A_month_plans_jars_in_the_order_they_were_planned_and_a_new_month_copies_them()
    {
        var car = Guid.CreateVersion7();
        var laptop = Guid.CreateVersion7();
        var october = BudgetMonth.Start(Person, new DateOnly(2026, 10, 1), Now);
        october.SetJar(car, 15_000.4m);
        october.SetJar(laptop, 12_000);
        october.SetJar(car, 14_000);

        var november = BudgetMonth.Start(Person, new DateOnly(2026, 11, 1), Now, october);

        november.Jars.OrderBy(jar => jar.Order).Select(jar => (jar.JarId, jar.Amount))
            .Should().Equal((car, 14_000m), (laptop, 12_000m));
        november.Plan.Jars.Should().HaveCount(2);

        november.SetJar(car, null);
        november.Jars.Select(jar => jar.JarId).Should().Equal(laptop);
    }
}
