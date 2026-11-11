using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Reports;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Reports;

public sealed class ReportBuilderTests
{
    /// <summary>Kyiv's today in these tests: November is this month, December still to come.</summary>
    private static readonly DateOnly Today = new(2026, 11, 4);

    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly Guid Hryvnias = Guid.CreateVersion7();
    private static readonly Guid Dollars = Guid.CreateVersion7();

    private static readonly CategoryGroup Income = Group("Income", CategoryKind.Income, 1, "Salary", "Other");
    private static readonly CategoryGroup Daily = Group("Daily living", CategoryKind.Expense, 2, "Groceries", "Eating out");
    private static readonly CategoryGroup Health = Group("Health", CategoryKind.Expense, 3, "Doctor/Dentist");

    private static readonly Guid Salary = Income.Categories.First().Id;
    private static readonly Guid Groceries = Daily.Categories.First().Id;
    private static readonly Guid EatingOut = Daily.Categories.Last().Id;
    private static readonly Guid Doctor = Health.Categories.First().Id;

    private static CategoryGroup Group(string name, CategoryKind kind, int order, params string[] categories)
    {
        var group = new CategoryGroup { Id = Guid.CreateVersion7(), UserId = UserId, Name = name, Kind = kind, SortOrder = order };
        for (var index = 0; index < categories.Length; index++)
        {
            group.Categories.Add(new Category
            {
                Id = Guid.CreateVersion7(), GroupId = group.Id, Name = categories[index], SortOrder = index + 1,
            });
        }

        return group;
    }

    private static DayRates Dollar(decimal rate, DateOnly day, RatesStatus status = RatesStatus.Current) =>
        new(day, status, new Dictionary<string, decimal> { ["USD"] = rate, ["EUR"] = 50m });

    private static Report Build(
        ReportPeriod period,
        IReadOnlyList<ReportAmount>? amounts = null,
        IReadOnlyList<ReportAccount>? accounts = null,
        IReadOnlyList<MonthMovement>? movements = null,
        DateOnly? firstDay = null,
        IReadOnlyDictionary<DateOnly, DayRates>? rates = null,
        string currency = "UAH",
        IReadOnlyList<CategoryGroup>? groups = null,
        bool noFirstDay = false) =>
        ReportBuilder.Build(
            period,
            currency,
            Today,
            new ReportData(
                groups ?? [Income, Daily, Health],
                amounts ?? [],
                accounts ?? [],
                movements ?? [],
                noFirstDay ? null : firstDay ?? new DateOnly(2026, 1, 1)),
            rates ?? new Dictionary<DateOnly, DayRates>());

    private static ReportAmount Spent(DateOnly date, Guid category, decimal amount, string currency = "UAH") =>
        new(date, TransactionType.Expense, currency, category, amount);

    private static ReportAmount Received(DateOnly date, Guid category, decimal amount, string currency = "UAH") =>
        new(date, TransactionType.Income, currency, category, amount);

    [Fact]
    public void The_rows_are_the_groups_and_categories_in_the_categories_pages_order_with_their_months()
    {
        var report = Build(
            ReportPeriod.Year(2026),
            [Spent(new(2026, 3, 2), Groceries, 900m), Spent(new(2026, 3, 20), Groceries, 100m), Spent(new(2026, 4, 1), EatingOut, 380m)],
            groups: [Health, Daily, Income]);

        report.Groups.Select(group => group.Name).Should().Equal("Income", "Daily living", "Health");
        var daily = report.Groups[1];
        daily.Categories.Select(category => category.Name).Should().Equal("Groceries", "Eating out");
        daily.Categories[0].Amounts.Months.Should().Equal(0m, 0m, 1_000m, 0m, 0m, 0m, 0m, 0m, 0m, 0m, 0m, null);
        daily.Categories[0].Amounts.Total.Should().Be(1_000m);
        daily.Total.Months[2].Should().Be(1_000m);
        daily.Total.Months[3].Should().Be(380m);
        daily.Total.Total.Should().Be(1_380m);
    }

    [Fact]
    public void A_category_with_nothing_is_a_row_an_archived_one_only_with_amounts_in_the_period()
    {
        var archivedEmpty = new Category { Id = Guid.CreateVersion7(), GroupId = Health.Id, Name = "Therapy", SortOrder = 2, IsArchived = true };
        var archivedUsed = new Category { Id = Guid.CreateVersion7(), GroupId = Health.Id, Name = "Emergency", SortOrder = 3, IsArchived = true };
        var health = Group("Health", CategoryKind.Expense, 3, "Doctor/Dentist");
        health.Categories.Add(archivedEmpty);
        health.Categories.Add(archivedUsed);

        var report = Build(
            ReportPeriod.Year(2026), [Spent(new(2026, 2, 3), archivedUsed.Id, 800m)], groups: [Income, Daily, health]);

        report.Groups[2].Categories.Select(category => (category.Name, category.IsArchived))
            .Should().Equal(("Doctor/Dentist", false), ("Emergency", true));
        report.Groups[2].Categories[0].Amounts.Total.Should().Be(0m);
    }

    [Fact]
    public void A_hidden_group_is_a_row_only_while_one_of_its_hidden_categories_has_amounts_in_the_period()
    {
        CategoryGroup Hidden(string name, int order)
        {
            var group = Group(name, CategoryKind.Expense, order, "Old");
            group.IsArchived = true;
            group.Categories.Single().IsArchived = true;
            return group;
        }

        var used = Hidden("Pets", 4);
        var unused = Hidden("Car", 5);

        var report = Build(
            ReportPeriod.Year(2026),
            [Spent(new(2026, 2, 3), used.Categories.Single().Id, 300m)],
            groups: [Income, Daily, Health, used, unused]);

        report.Groups.Select(group => group.Name).Should().Equal("Income", "Daily living", "Health", "Pets");
        report.Groups[3].Total.Total.Should().Be(300m);
    }

    [Fact]
    public void The_summary_has_income_expenses_and_net_by_month()
    {
        var report = Build(
            ReportPeriod.Year(2026),
            [
                Received(new(2026, 1, 9), Salary, 60_000m),
                Spent(new(2026, 1, 10), Groceries, 2_000m),
                Spent(new(2026, 1, 12), Doctor, 1_500m),
                Spent(new(2026, 2, 1), Groceries, 70_000m),
            ]);

        report.Summary.Income.Months.Take(2).Should().Equal(60_000m, 0m);
        report.Summary.Expenses.Months.Take(2).Should().Equal(3_500m, 70_000m);
        report.Summary.Net.Months.Take(2).Should().Equal(56_500m, -70_000m);
        report.Summary.Net.Total.Should().Be(-13_500m);
    }

    [Fact]
    public void Amounts_in_another_currency_are_converted_at_the_rate_of_their_own_day()
    {
        var march2 = new DateOnly(2026, 3, 2);
        var march20 = new DateOnly(2026, 3, 20);
        var report = Build(
            ReportPeriod.Year(2026),
            [Received(march2, Salary, 1_000m, "USD"), Received(march20, Salary, 1_000m, "USD"), Received(march20, Salary, 500m)],
            rates: new Dictionary<DateOnly, DayRates> { [march2] = Dollar(41m, march2), [march20] = Dollar(42m, march20) });

        report.Summary.Income.Months[2].Should().Be(41_000m + 42_000m + 500m);
        report.Months[2].RatesMissing.Should().BeFalse();
    }

    [Fact]
    public void In_another_report_currency_the_hryvnias_are_converted_and_its_own_amounts_are_not()
    {
        var day = new DateOnly(2026, 3, 2);
        var report = Build(
            ReportPeriod.Year(2026),
            [Spent(day, Groceries, 4_100m), Spent(day, EatingOut, 25m, "USD")],
            rates: new Dictionary<DateOnly, DayRates> { [day] = Dollar(41m, day) },
            currency: "USD");

        report.Currency.Should().Be("USD");
        report.Summary.Expenses.Months[2].Should().BeApproximately(100m + 25m, 0.000001m);
    }

    [Fact]
    public void An_amount_without_a_rate_is_left_out_and_its_month_is_marked()
    {
        var day = new DateOnly(2026, 5, 5);
        var report = Build(ReportPeriod.Year(2026), [Spent(day, Groceries, 300m), Spent(day, EatingOut, 10m, "USD")]);

        report.Summary.Expenses.Months[4].Should().Be(300m);
        report.Months[4].RatesMissing.Should().BeTrue();
        report.Months.Where(month => month.RatesMissing).Should().ContainSingle();
    }

    [Fact]
    public void Months_still_to_come_have_no_numbers()
    {
        var report = Build(ReportPeriod.Year(2026), accounts: [new(Hryvnias, "UAH", 1_000m, new(2026, 1, 1))]);

        report.Months.Select(month => month.State).Should().Equal(
            [.. Enumerable.Repeat(ReportMonthState.Passed, 10), ReportMonthState.Current, ReportMonthState.Future]);
        report.Summary.Income.Months[11].Should().BeNull();
        report.Summary.Balance.Months[10].Should().Be(1_000m);
        report.Summary.Balance.Months[11].Should().BeNull();
        report.Summary.OtherChanges.Months[11].Should().BeNull();
        report.Months[11].BalanceRates.Should().BeNull();
    }

    [Theory]
    [InlineData(2025, "2025-01-01", 12)]
    [InlineData(2026, "2026-01-15", 11)]
    [InlineData(2026, "2026-11-02", 1)]
    [InlineData(2026, "2026-10-31", 2)]
    [InlineData(2025, "2025-06-30", 7)]
    public void Avg_divides_by_the_months_from_the_first_month_with_data_up_to_this_one(
        int year, string firstDay, int months)
    {
        var report = Build(
            ReportPeriod.Year(year),
            [Spent(new(year, 6, 1), Groceries, 840m)],
            firstDay: DateOnly.Parse(firstDay, System.Globalization.CultureInfo.InvariantCulture));

        report.MonthsCounted.Should().Be(months);
        report.Summary.Expenses.Average.Should().Be(840m / months);
        report.Groups[1].Categories[0].Amounts.Average.Should().Be(840m / months);
        report.Groups[1].Total.Average.Should().Be(840m / months);
    }

    [Theory]
    [InlineData(true, "2025-06-30", "2025-06-01")]
    [InlineData(false, "2026-02-14", "2026-02-01")]
    [InlineData(true, null, null)]
    public void The_report_says_the_first_month_with_data(bool year, string? firstDay, string? firstMonth)
    {
        var period = year ? ReportPeriod.Year(2026) : ReportPeriod.Month(2026, 10);
        var first = firstDay is null
            ? (DateOnly?)null
            : DateOnly.Parse(firstDay, System.Globalization.CultureInfo.InvariantCulture);

        var report = Build(period, firstDay: first, noFirstDay: firstDay is null);

        report.FirstMonth.Should().Be(firstMonth is null
            ? null
            : DateOnly.Parse(firstMonth, System.Globalization.CultureInfo.InvariantCulture));
    }

    [Fact]
    public void A_year_before_the_first_data_has_no_avg()
    {
        var report = Build(ReportPeriod.Year(2025), firstDay: new DateOnly(2026, 2, 1));

        report.MonthsCounted.Should().Be(0);
        report.Summary.Expenses.Average.Should().BeNull();
        report.Summary.Expenses.Total.Should().Be(0m);
    }

    [Fact]
    public void A_monthly_report_is_one_month_with_no_avg_and_the_balance_it_started_with()
    {
        var accounts = new ReportAccount[] { new(Hryvnias, "UAH", 10_000m, new(2026, 1, 1)) };
        var movements = new MonthMovement[] { new(Hryvnias, 2026, 9, -1_000m), new(Hryvnias, 2026, 10, -2_500m) };

        var report = Build(
            ReportPeriod.Month(2026, 10), [Spent(new(2026, 10, 3), Groceries, 2_500m)], accounts, movements);

        report.Months.Should().ContainSingle().Which.Month.Should().Be(new DateOnly(2026, 10, 1));
        report.MonthsCounted.Should().BeNull();
        report.Summary.Expenses.Months.Should().Equal(2_500m);
        report.Summary.Expenses.Average.Should().BeNull();
        report.Summary.StartBalance.Should().Be(9_000m);
        report.Summary.Balance.Months.Should().Equal(6_500m);
        report.Summary.OtherChanges.Months.Should().Equal(0m);
    }

    [Fact]
    public void The_balance_at_a_months_end_is_in_the_report_currency_at_that_days_rate_and_this_months_at_todays()
    {
        var march31 = new DateOnly(2026, 3, 31);
        var accounts = new ReportAccount[]
        {
            new(Hryvnias, "UAH", 20_000m, new(2025, 12, 1)), new(Dollars, "USD", 1_000m, new(2025, 12, 1)),
        };
        var movements = new MonthMovement[] { new(Dollars, 2026, 3, 500m), new(Dollars, 2026, 11, -100m) };

        var report = Build(
            ReportPeriod.Year(2026),
            accounts: accounts,
            movements: movements,
            rates: new Dictionary<DateOnly, DayRates>
            {
                [march31] = Dollar(41m, march31),
                [Today] = Dollar(42m, new DateOnly(2026, 11, 3), RatesStatus.NotPublished),
            });

        report.Summary.Balance.Months[2].Should().Be(20_000m + (1_500m * 41m));
        report.Summary.Balance.Months[10].Should().Be(20_000m + (1_400m * 42m));
        report.Months[2].BalanceRates.Should().BeEquivalentTo(
            new RatesOfDay(march31, RatesStatus.Current, [new RateItem("USD", 41m)]));
        report.Months[10].BalanceRates!.Status.Should().Be(RatesStatus.NotPublished);
        report.Months[10].BalanceRates!.Date.Should().Be(new DateOnly(2026, 11, 3));
    }

    [Fact]
    public void An_account_counts_from_its_opening_dates_month_with_the_transactions_before_it_too()
    {
        var accounts = new ReportAccount[] { new(Hryvnias, "UAH", 5_000m, new(2026, 4, 20)) };
        var movements = new MonthMovement[] { new(Hryvnias, 2026, 2, -300m), new(Hryvnias, 2026, 5, -700m) };

        var report = Build(ReportPeriod.Year(2026), accounts: accounts, movements: movements);

        report.Summary.Balance.Months.Take(6).Should().Equal(0m, 0m, 0m, 4_700m, 4_000m, 4_000m);
        report.Summary.OtherChanges.Months[3].Should().Be(4_700m);
    }

    [Fact]
    public void An_archived_account_counts_until_the_month_before_it_was_archived()
    {
        var accounts = new ReportAccount[]
        {
            new(Hryvnias, "UAH", 10_000m, new(2026, 1, 1)),
            new(Dollars, "UAH", 2_000m, new(2026, 1, 1), ArchivedOn: new(2026, 8, 12)),
        };

        var report = Build(ReportPeriod.Year(2026), accounts: accounts);

        report.Summary.Balance.Months[6].Should().Be(12_000m);
        report.Summary.Balance.Months[7].Should().Be(10_000m);
        report.Summary.Balance.Months[10].Should().Be(10_000m);
    }

    [Fact]
    public void Start_balance_plus_net_plus_other_changes_is_the_end_balance_in_every_month()
    {
        var february28 = new DateOnly(2026, 2, 28);
        var january31 = new DateOnly(2026, 1, 31);
        var december31 = new DateOnly(2025, 12, 31);
        var accounts = new ReportAccount[]
        {
            new(Hryvnias, "UAH", 10_000m, new(2025, 12, 1)), new(Dollars, "USD", 1_000m, new(2025, 12, 1)),
        };

        // January: a salary of $1 000 at 41, groceries; February: $500 sold for 20 400 ₴ at the bank, the dollar at 41.5
        var report = Build(
            ReportPeriod.Year(2026),
            [Received(new(2026, 1, 9), Salary, 1_000m, "USD"), Spent(new(2026, 1, 10), Groceries, 3_000m)],
            accounts,
            [
                new(Dollars, 2026, 1, 1_000m), new(Hryvnias, 2026, 1, -3_000m),
                new(Dollars, 2026, 2, -500m), new(Hryvnias, 2026, 2, 20_400m),
            ],
            rates: new Dictionary<DateOnly, DayRates>
            {
                [december31] = Dollar(40m, december31),
                [new(2026, 1, 9)] = Dollar(41m, new(2026, 1, 9)),
                [january31] = Dollar(41m, january31),
                [february28] = Dollar(41.5m, february28),
            });

        report.Summary.StartBalance.Should().Be(10_000m + 40_000m);
        report.Summary.Balance.Months[0].Should().Be(7_000m + 82_000m);
        report.Summary.Net.Months[0].Should().Be(41_000m - 3_000m);
        report.Summary.OtherChanges.Months[0].Should().Be(1_000m);
        report.Summary.Balance.Months[1].Should().Be(27_400m + 62_250m);
        report.Summary.OtherChanges.Months[1].Should().Be(27_400m + 62_250m - 89_000m);

        var previous = report.Summary.StartBalance;
        for (var index = 0; index < 2; index++)
        {
            (previous + report.Summary.Net.Months[index] + report.Summary.OtherChanges.Months[index])
                .Should().Be(report.Summary.Balance.Months[index]);
            previous = report.Summary.Balance.Months[index];
        }
    }

    [Fact]
    public void A_balance_without_a_rate_is_none_and_so_are_its_other_changes_and_their_total()
    {
        var accounts = new ReportAccount[] { new(Dollars, "USD", 1_000m, new(2026, 1, 1)) };

        var report = Build(ReportPeriod.Year(2026), accounts: accounts);

        report.Summary.Balance.Months[0].Should().BeNull();
        report.Summary.OtherChanges.Months[0].Should().BeNull();
        report.Summary.OtherChanges.Total.Should().BeNull();
        report.Months[0].BalanceRates!.Status.Should().Be(RatesStatus.Missing);
    }

    [Fact]
    public void A_month_with_amounts_left_out_has_no_other_changes()
    {
        var day = new DateOnly(2026, 5, 5);
        var accounts = new ReportAccount[] { new(Hryvnias, "UAH", 1_000m, new(2026, 1, 1)) };

        var report = Build(ReportPeriod.Year(2026), [Spent(day, EatingOut, 10m, "USD")], accounts);

        report.Summary.Balance.Months[4].Should().Be(1_000m);
        report.Summary.OtherChanges.Months[4].Should().BeNull();
        report.Summary.OtherChanges.Months[3].Should().Be(0m);
    }

    [Fact]
    public void The_rate_days_are_those_with_amounts_in_another_currency_and_the_month_ends_with_other_accounts()
    {
        var accounts = new ReportAccount[]
        {
            new(Hryvnias, "UAH", 0m, new(2025, 1, 1)), new(Dollars, "USD", 0m, new(2026, 10, 5)),
        };
        var data = new ReportData(
            [Income, Daily],
            [Spent(new(2026, 3, 2), Groceries, 10m, "USD"), Spent(new(2026, 3, 3), Groceries, 100m)],
            accounts,
            [],
            new DateOnly(2025, 1, 1));

        ReportBuilder.RateDaysOf(ReportPeriod.Year(2026), "UAH", Today, data).Should().Equal(
            new DateOnly(2026, 3, 2), new DateOnly(2026, 10, 31), Today);
        ReportBuilder.RateDaysOf(ReportPeriod.Month(2026, 3), "USD", Today, data).Should().Equal(
            new DateOnly(2026, 2, 28), new DateOnly(2026, 3, 3), new DateOnly(2026, 3, 31));
    }
}
