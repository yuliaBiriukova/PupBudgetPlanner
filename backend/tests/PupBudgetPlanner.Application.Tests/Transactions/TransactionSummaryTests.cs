using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Transactions;

public sealed class TransactionSummaryTests
{
    private static readonly DateOnly October1 = new(2026, 10, 1);
    private static readonly DateOnly October2 = new(2026, 10, 2);

    private static readonly Guid Groceries = Guid.CreateVersion7();
    private static readonly Guid EatingOut = Guid.CreateVersion7();
    private static readonly Guid Spotify = Guid.CreateVersion7();
    private static readonly Guid Salary = Guid.CreateVersion7();

    private static readonly Dictionary<Guid, string> Names = new()
    {
        [Groceries] = "Groceries", [EatingOut] = "Eating out", [Spotify] = "Spotify", [Salary] = "Salary",
    };

    /// <summary>Both days' NBU rates: a dollar is 45.53 ₴ on the first, 45.60 ₴ on the second; a euro 48.60 ₴.</summary>
    private static readonly Dictionary<DateOnly, IReadOnlyDictionary<string, decimal>> Rates = new()
    {
        [October1] = new Dictionary<string, decimal> { ["USD"] = 45.53m, ["EUR"] = 48.6m },
        [October2] = new Dictionary<string, decimal> { ["USD"] = 45.6m, ["EUR"] = 48.6m },
    };

    /// <summary>Two days: groceries and a dollar subscription, a salary, eating out, a transfer.</summary>
    private static readonly SummaryRow[] Rows =
    [
        new(October1, TransactionType.Expense, "UAH", Groceries, 2, 900m),
        new(October1, TransactionType.Expense, "USD", Spotify, 1, 10m),
        new(October1, TransactionType.Income, "UAH", Salary, 1, 62_000m),
        new(October2, TransactionType.Expense, "UAH", EatingOut, 1, 380m),
        new(October2, TransactionType.Expense, "UAH", Groceries, 1, 120m),
        new(October2, TransactionType.Transfer, "UAH", null, 1, 2_000m),
    ];

    private static TransactionSummary Of(
        IReadOnlyList<SummaryRow> rows, string currency = "UAH", Guid? category = null, TransactionType? type = null) =>
        TransactionSummary.Of(rows, currency, Rates, category, type, Names);

    [Fact]
    public void Spent_and_received_are_in_the_report_currency_at_each_days_rate_and_leave_transfers_out()
    {
        var summary = Of(Rows);

        summary.Currency.Should().Be("UAH");
        summary.Spent.Should().Be(900m + (10m * 45.53m) + 380m + 120m);
        summary.Received.Should().Be(62_000m);
        summary.Count.Should().Be(7);
        summary.RatesMissing.Should().BeFalse();
    }

    [Fact]
    public void Each_day_has_its_own_totals_and_counts_its_transfers_too_on_their_own()
    {
        var summary = Of(Rows);

        summary.Days.Should().Equal(
            new DayTotal(October1, 900m + (10m * 45.53m), 62_000m, 4),
            new DayTotal(October2, 500m, 0m, 3, Transfers: 1));
    }

    [Fact]
    public void Lines_seen_only_in_the_totals_count_in_them_and_where_it_went_but_not_on_the_days()
    {
        // Someone in the family shares only totals (F-030): their groceries on October 2 aren't lines
        SummaryRow[] rows =
        [
            .. Rows,
            new(October2, TransactionType.Expense, "UAH", Groceries, 3, 1_000m, Listed: false),
            new(October2, TransactionType.Income, "UAH", Salary, 1, 5_000m, Listed: false),
        ];

        var summary = Of(rows);

        summary.Spent.Should().Be(900m + (10m * 45.53m) + 380m + 120m + 1_000m);
        summary.Received.Should().Be(62_000m + 5_000m);
        summary.Count.Should().Be(7);
        summary.Days.Should().Equal(
            new DayTotal(October1, 900m + (10m * 45.53m), 62_000m, 4),
            new DayTotal(October2, 500m, 0m, 3, Transfers: 1));
        summary.Categories.Single(category => category.CategoryId == Groceries).Amount.Should().Be(2_020m);
    }

    [Fact]
    public void A_report_currency_other_than_the_hryvnia_converts_hryvnias_too()
    {
        var summary = Of([new(October2, TransactionType.Expense, "UAH", Groceries, 1, 456m)], "USD");

        summary.Spent.Should().BeApproximately(10m, 0.000001m);
    }

    [Fact]
    public void The_categories_are_the_expenses_largest_first_with_the_picked_one_left_out_of_their_filter()
    {
        var summary = Of(Rows, category: Groceries);

        summary.Categories.Should().Equal(
            new CategoryTotal(Groceries, "Groceries", 1_020m),
            new CategoryTotal(Spotify, "Spotify", 10m * 45.53m),
            new CategoryTotal(EatingOut, "Eating out", 380m));
        // The totals, the days and the count are the picked category's only
        summary.Spent.Should().Be(1_020m);
        summary.Received.Should().Be(0m);
        summary.Count.Should().Be(3);
        summary.Days.Select(day => day.Count).Should().Equal(2, 1);
        summary.Days.Should().OnlyContain(day => day.Transfers == 0);
    }

    [Fact]
    public void With_income_picked_the_categories_are_where_it_came_from_and_with_transfers_there_are_none()
    {
        Of(Rows, type: TransactionType.Income).Categories.Should().Equal(
            new CategoryTotal(Salary, "Salary", 62_000m));
        Of(Rows, type: TransactionType.Transfer).Categories.Should().BeEmpty();
    }

    [Fact]
    public void An_amount_without_a_rate_is_left_out_and_said_so()
    {
        var summary = Of([.. Rows, new(new DateOnly(2026, 9, 30), TransactionType.Expense, "EUR", Groceries, 1, 40m)]);

        summary.RatesMissing.Should().BeTrue();
        summary.Spent.Should().Be(900m + (10m * 45.53m) + 380m + 120m);
        summary.Count.Should().Be(8);
    }

    [Fact]
    public void Nothing_found_comes_to_nothing()
    {
        var summary = Of([]);

        summary.Should().BeEquivalentTo(new TransactionSummary("UAH", 0m, 0m, 0, [], [], false));
    }
}
