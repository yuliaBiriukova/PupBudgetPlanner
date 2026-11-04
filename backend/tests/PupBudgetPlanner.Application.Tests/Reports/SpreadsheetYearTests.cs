using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Reports;
using PupBudgetPlanner.Domain;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Reports;

/// <summary>
/// A test year in the spreadsheet's shape (F-021): January to October 2026 filled in, each month's category amounts typed
/// as one transaction on the 15th. The expenses are hryvnias, so every category's, group's and month's total is the
/// spreadsheet's to the hryvnia. The salary is in dollars and sold at the bank each month; income, Avg and the balances
/// differ from the spreadsheet on purpose (each day's rate rather than today's, Avg ÷ the months passed rather than 12,
/// what is really on the accounts), so they are worked out by hand from the fixed rates below.
/// </summary>
public sealed class SpreadsheetYearTests
{
    private static readonly DateOnly Today = new(2026, 11, 4);
    private static readonly DateOnly OpeningDate = new(2025, 12, 31);

    private static readonly Guid Hryvnias = Guid.CreateVersion7();
    private static readonly Guid Dollars = Guid.CreateVersion7();
    private static readonly Guid Euros = Guid.CreateVersion7();

    /// <summary>January to October; the months left out of a row had nothing.</summary>
    private static readonly decimal[] Salary = [2229, 3360, 3127, 3124, 3048, 2680, 2852, 2852, 2583, 2000];

    private static readonly Dictionary<(string Group, string Category), decimal[]> Amounts = new()
    {
        [("Income", "Gifts")] = [0, 0, 0, 0, 0, 5000, 0, 0, 0, 0],
        [("Income", "Other")] = [3100, 1000, 0, 0, 0, 11800, 9506, 2389, 1058, 2679],
        [("Home expenses", "Rent")] = [17000, 17000, 17000, 17000, 17000, 66700, 0, 20800, 24700, 23732],
        [("Home expenses", "Bills")] = [3647, 2126, 2965, 3310, 2731, 3073, 0, 0, 2500, 2750],
        [("Home expenses", "Home supplies")] = [473, 664, 4330, 0, 0, 1541, 9328, 0, 2298, 0],
        [("Home expenses", "Electronics")] = [423, 0, 3057, 3935, 0, 0, 0, 20698, 0, 6541],
        [("Home expenses", "Bank commission")] = [38, 3, 3, 66, 3, 553, 251, 333, 301, 302],
        [("Home expenses", "Gifts")] = [2635, 732, 1000, 0, 0, 1740, 0, 41027, 3232, 5856],
        [("Home expenses", "Tax")] = [0, 19386, 5707, 0, 20610, 0, 30535, 0, 5707, 0],
        [("Home expenses", "Delivery")] = [614, 102, 1176, 1121, 687, 326, 2110, 1020, 1595, 893],
        [("Home expenses", "Other")] = [0, 100, 0, 900, 0, 0, 0, 0, 40, 60],
        [("Daily living", "Groceries")] = [1707, 1178, 1342, 3199, 35, 4222, 3880, 3755, 2365, 3353],
        [("Daily living", "Clothing")] = [0, 3541, 19830, 22625, 1514, 4956, 3394, 3002, 0, 7861],
        [("Daily living", "Eating out")] = [3733, 0, 0, 4103, 2871, 17970, 6028, 7266, 1724, 4813],
        [("Daily living", "Transportation")] = [1423, 1693, 963, 2775, 408, 7310, 4096, 2778, 1544, 2100],
        [("Daily living", "Salon/Barber")] = [1250, 0, 4165, 2200, 800, 1800, 0, 2410, 2200, 2000],
        [("Health", "Doctor/Dentist")] = [5126, 3420, 0, 8290, 0, 0, 4465, 2580, 0, 0],
        [("Health", "Medicine/Drugs/Skincare")] = [1778, 2380, 3591, 6293, 1909, 5209, 4552, 6170, 5427, 3580],
        [("Health", "Emergency")] = [122361, 0, 0, 0, 0, 0, 800, 0, 0, 0],
        [("Health", "Therapy")] = [0, 0, 0, 0, 0, 0, 8297, 4702, 4720, 4702],
        [("Education", "Piano lessons")] = [0, 0, 0, 0, 500, 0, 0, 0, 0, 0],
        [("Education", "Driving")] = [0, 0, 0, 0, 316, 0, 0, 0, 16100, 15300],
        [("Entertainment", "Activities")] = [2450, 800, 3237, 3874, 0, 1640, 549, 788, 2570, 4695],
        [("Entertainment", "Games")] = [1220, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [("Entertainment", "Hobbies")] = [3906, 819, 6750, 6325, 1080, 7290, 1422, 7084, 8660, 5699],
        [("Entertainment", "Vacation")] = [0, 0, 0, 0, 13056, 0, 0, 0, 0, 0],
        [("Subscriptions", "Phone")] = [0, 0, 600, 0, 600, 260, 0, 600, 0, 600],
        [("Subscriptions", "Subscriptions")] = [0, 0, 406, 0, 270, 0, 0, 170, 0, 0],
    };

    /// <summary>Fixed test rates: on the 15th a dollar is 41.00 ₴ in January and 10 kopiykas more each month, a euro 48.00 ₴ and the same; at a month's end both are 5 kopiykas more again.</summary>
    private static decimal DollarOn15th(int month) => 41m + (0.1m * (month - 1));

    private static decimal EuroOn15th(int month) => 48m + (0.1m * (month - 1));

    private static readonly Report Report = Build();

    private static Report Build()
    {
        var groups = DefaultCategories.CreateFor(Guid.CreateVersion7());
        Guid CategoryOf(string group, string category) =>
            groups.Single(item => item.Name == group).Categories.Single(item => item.Name == category).Id;

        var amounts = new List<ReportAmount>();
        var movements = new List<MonthMovement>();
        var rates = new Dictionary<DateOnly, DayRates>
        {
            [OpeningDate] = Rates(OpeningDate, 40.95m, 47.95m),
            [Today] = Rates(Today, 42m, 49m),
        };
        for (var month = 1; month <= 10; month++)
        {
            var day = new DateOnly(2026, month, 15);
            var end = new DateOnly(2026, month, DateTime.DaysInMonth(2026, month));
            rates[day] = Rates(day, DollarOn15th(month), EuroOn15th(month));
            rates[end] = Rates(end, DollarOn15th(month) + 0.05m, EuroOn15th(month) + 0.05m);

            var hryvnias = 0m;
            foreach (var ((group, category), months) in Amounts.Where(row => row.Value[month - 1] != 0))
            {
                var type = group == "Income" ? TransactionType.Income : TransactionType.Expense;
                amounts.Add(new ReportAmount(day, type, "UAH", CategoryOf(group, category), months[month - 1]));
                hryvnias += Transaction.MovementOf(type, months[month - 1]);
            }

            // The salary comes to the dollar account and is sold at the bank's rate, 30 kopiykas under the NBU's
            var salary = Salary[month - 1];
            amounts.Add(new ReportAmount(day, TransactionType.Income, "USD", CategoryOf("Income", "Salary"), salary));
            movements.Add(new MonthMovement(Dollars, 2026, month, salary));
            movements.Add(new MonthMovement(Dollars, 2026, month, -salary));
            movements.Add(new MonthMovement(Hryvnias, 2026, month, hryvnias + Money.Whole(salary * (DollarOn15th(month) - 0.3m))));
        }

        var accounts = new ReportAccount[]
        {
            new(Hryvnias, "UAH", -50_000m, OpeningDate), new(Dollars, "USD", 15_178m, OpeningDate),
            new(Euros, "EUR", 2_000m, OpeningDate),
        };
        var data = new ReportData(groups, amounts, accounts, movements, OpeningDate);

        ReportBuilder.RateDaysOf(ReportPeriod.Year(2026), "UAH", Today, data).Should().BeSubsetOf(rates.Keys);
        return ReportBuilder.Build(ReportPeriod.Year(2026), "UAH", Today, data, rates);
    }

    private static DayRates Rates(DateOnly day, decimal dollar, decimal euro) =>
        new(day, RatesStatus.Current, new Dictionary<string, decimal> { ["USD"] = dollar, ["EUR"] = euro });

    private static ReportGroup GroupOf(string name) => Report.Groups.Single(group => group.Name == name);

    private static decimal?[] Months(params decimal[] filledIn) => [.. filledIn.Select(value => (decimal?)value), 0m, null];

    [Theory]
    [InlineData("Home expenses", "Rent", 220932)]
    [InlineData("Home expenses", "Bills", 23102)]
    [InlineData("Home expenses", "Home supplies", 18634)]
    [InlineData("Home expenses", "Electronics", 34654)]
    [InlineData("Home expenses", "Bank commission", 1853)]
    [InlineData("Home expenses", "Gifts", 56222)]
    [InlineData("Home expenses", "Tax", 81945)]
    [InlineData("Home expenses", "Delivery", 9644)]
    [InlineData("Home expenses", "Other", 1100)]
    [InlineData("Daily living", "Groceries", 25036)]
    [InlineData("Daily living", "Clothing", 66723)]
    [InlineData("Daily living", "Eating out", 48508)]
    [InlineData("Daily living", "Transportation", 25090)]
    [InlineData("Daily living", "Salon/Barber", 16825)]
    [InlineData("Daily living", "Sport", 0)]
    [InlineData("Health", "Doctor/Dentist", 23881)]
    [InlineData("Health", "Medicine/Drugs/Skincare", 40889)]
    [InlineData("Health", "Emergency", 123161)]
    [InlineData("Health", "Therapy", 22421)]
    [InlineData("Education", "English lessons", 0)]
    [InlineData("Education", "Piano lessons", 500)]
    [InlineData("Education", "Driving", 31716)]
    [InlineData("Entertainment", "Activities", 20603)]
    [InlineData("Entertainment", "Books", 0)]
    [InlineData("Entertainment", "Games", 1220)]
    [InlineData("Entertainment", "Hobbies", 49035)]
    [InlineData("Entertainment", "Vacation", 13056)]
    [InlineData("Subscriptions", "Spotify", 0)]
    [InlineData("Subscriptions", "Phone", 2660)]
    [InlineData("Subscriptions", "Subscriptions", 846)]
    [InlineData("Income", "Gifts", 5000)]
    [InlineData("Income", "Other", 31532)]
    public void Every_category_in_hryvnias_comes_to_the_spreadsheets_total(string group, string category, int total)
    {
        var row = GroupOf(group).Categories.Single(item => item.Name == category);

        row.Amounts.Total.Should().Be(total);
        row.Amounts.Average.Should().Be(total / 11m);
    }

    [Fact]
    public void Every_expense_group_comes_to_the_spreadsheets_months_and_total()
    {
        GroupOf("Home expenses").Total.Months.Should().Equal(
            Months(24830, 40113, 35238, 26332, 41031, 73933, 42224, 83878, 40373, 40134));
        GroupOf("Daily living").Total.Months.Should().Equal(
            Months(8113, 6412, 26300, 34902, 5628, 36258, 17398, 19211, 7833, 20127));
        GroupOf("Health").Total.Months.Should().Equal(
            Months(129265, 5800, 3591, 14583, 1909, 5209, 18114, 13452, 10147, 8282));
        GroupOf("Education").Total.Months.Should().Equal(Months(0, 0, 0, 0, 816, 0, 0, 0, 16100, 15300));
        GroupOf("Entertainment").Total.Months.Should().Equal(
            Months(7576, 1619, 9987, 10199, 14136, 8930, 1971, 7872, 11230, 10394));
        GroupOf("Subscriptions").Total.Months.Should().Equal(Months(0, 0, 1006, 0, 870, 260, 0, 770, 0, 600));
        Report.Groups.Select(group => group.Total.Total)
            .Should().Equal(IncomeTotal, 448_086m, 182_182m, 210_352m, 32_216m, 83_914m, 3_506m);
    }

    private const decimal IncomeTotal = 1_190_618.8m;

    [Fact]
    public void Total_expenses_are_the_spreadsheets_and_avg_divides_them_by_the_eleven_months_up_to_november()
    {
        Report.MonthsCounted.Should().Be(11);
        Report.Summary.Expenses.Months.Should().Equal(
            Months(169784, 53944, 76122, 86016, 64390, 124590, 79707, 125183, 85683, 94837));
        Report.Summary.Expenses.Total.Should().Be(960_256m);
        Report.Summary.Expenses.Average.Should().Be(87_296m);
    }

    [Fact]
    public void Income_takes_each_salary_at_the_dollar_rate_of_its_day()
    {
        Report.Summary.Income.Months.Should().Equal(
            Months(94489m, 139096m, 128832.4m, 129021.2m, 126187.2m, 128020m, 128149.2m, 121317.4m, 109027.4m, 86479m));
        Report.Summary.Income.Total.Should().Be(IncomeTotal);
        Report.Summary.Net.Months.Should().Equal(
            Months(-75295m, 85152m, 52710.4m, 43005.2m, 61797.2m, 3430m, 48442.2m, -3865.6m, 23344.4m, -8358m));
        Report.Summary.Net.Total.Should().Be(IncomeTotal - 960_256m);
    }

    [Fact]
    public void The_balance_is_what_is_on_the_accounts_and_other_changes_are_the_bank_rate_and_the_currencies_worth()
    {
        Report.Summary.StartBalance.Should().Be(-50_000m + (15_178m * 40.95m) + (2_000m * 47.95m));
        Report.Summary.Balance.Months.Should().Equal(
            593192.9m, 679054.7m, 732544.5m, 776330.3m, 838931.1m, 843274.9m, 892579.7m, 889576.5m, 913864.3m,
            906624.1m, 907483m, null);

        // January: 2 229 $ sold for 669 ₴ under the NBU's rate; the dollars and euros worth 10 kopiykas more each
        Report.Summary.OtherChanges.Months[0].Should().Be(-669m + 1_517.8m + 200m);
        Report.Summary.OtherChanges.Months.Should().Equal(
            1048.8m, 709.8m, 779.4m, 780.6m, 803.6m, 913.8m, 862.6m, 862.4m, 943.4m, 1117.8m, 858.9m, null);
        Report.Summary.OtherChanges.Total.Should().Be(907_483m - 667_439.1m - (IncomeTotal - 960_256m));
    }
}
