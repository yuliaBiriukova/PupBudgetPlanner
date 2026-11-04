using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Reports;

/// <summary>
/// The months a report is for: <paramref name="Months"/> months from the one <paramref name="First"/> starts (its
/// first day). A yearly report is January to December; a monthly one is one month.
/// </summary>
public sealed record ReportPeriod(DateOnly First, int Months)
{
    public static ReportPeriod Year(int year) => new(new DateOnly(year, 1, 1), 12);

    public static ReportPeriod Month(int year, int month) => new(new DateOnly(year, month, 1), 1);

    /// <summary>The period's last day.</summary>
    public DateOnly Last => First.AddMonths(Months).AddDays(-1);

    /// <summary>Whether it is a whole year, the only report with an Avg.</summary>
    public bool IsYear => Months == 12 && First.Month == 1;
}

/// <summary>Incomes or expenses of one day, one account currency and one category, summed by the database.</summary>
public sealed record ReportAmount(DateOnly Date, TransactionType Type, string Currency, Guid CategoryId, decimal Amount);

/// <summary>
/// One account as the month-end balances need it: what was on it on its opening date, and the day it was archived
/// in Kyiv (none while it is in use).
/// </summary>
public sealed record ReportAccount(
    Guid Id, string Currency, decimal OpeningBalance, DateOnly OpeningDate, DateOnly? ArchivedOn = null);

/// <summary>
/// An account's movement in one month, summed by the database: its incomes and incoming transfers less its expenses
/// and outgoing transfers.
/// </summary>
public sealed record MonthMovement(Guid AccountId, int Year, int Month, decimal Amount);

/// <summary>
/// What a report is worked out from: the person's category groups with every category (archived ones too), the
/// period's incomes and expenses, every account, the accounts' movements up to the period's end, and the first day
/// with data (the earliest opening date or transaction; none without either).
/// </summary>
public sealed record ReportData(
    IReadOnlyList<CategoryGroup> Groups,
    IReadOnlyList<ReportAmount> Amounts,
    IReadOnlyList<ReportAccount> Accounts,
    IReadOnlyList<MonthMovement> Movements,
    DateOnly? FirstDay);

/// <summary>Where a month is against Kyiv's today: over, under way, or still to come (then it has no numbers).</summary>
public enum ReportMonthState
{
    Passed,
    Current,
    Future,
}

/// <summary>
/// A column of the report. <paramref name="Month"/> is its first day. <paramref name="RatesMissing"/>: some incomes or
/// expenses in another currency had no rate and aren't in its numbers. <paramref name="BalanceRates"/> are the rates
/// its month-end balance used, in hryvnias as the NBU publishes them (ADR 0020): the day's (today's for this month),
/// or the latest earlier ones, marked; none when the balance needed no rates or the month is still to come.
/// </summary>
public sealed record ReportMonth(DateOnly Month, ReportMonthState State, bool RatesMissing, RatesOfDay? BalanceRates);

/// <summary>
/// A row's numbers: one a month in the report's order (none for a month still to come), the period's
/// <paramref name="Total"/> and <paramref name="Average"/> (Avg, the yearly report's only). A row that isn't a sum has
/// no total, and a total with a month missing is none rather than short.
/// </summary>
public sealed record ReportLine(IReadOnlyList<decimal?> Months, decimal? Total, decimal? Average);

/// <summary>A category's row. An archived one is a row only when the period has amounts on it.</summary>
public sealed record ReportCategory(Guid Id, string Name, bool IsArchived, ReportLine Amounts);

/// <summary>A section of the report: the group's categories in the Categories page's order and the group's total.</summary>
public sealed record ReportGroup(
    Guid Id, string Name, CategoryKind Kind, IReadOnlyList<ReportCategory> Categories, ReportLine Total);

/// <summary>
/// The rows under the table (PRODUCT.md, business rules 4 and 7). <paramref name="Net"/> is income less expenses.
/// <paramref name="Balance"/> is what was really on the accounts at each month's end, the balance now for this month;
/// <paramref name="StartBalance"/> the one at the end of the month before the period. <paramref name="OtherChanges"/>
/// is each month's change in balance less its NET: the rates, exchanges and new accounts, so start + NET + other
/// changes = end in every month.
/// </summary>
public sealed record ReportSummary(
    ReportLine Income,
    ReportLine Expenses,
    ReportLine Net,
    ReportLine OtherChanges,
    ReportLine Balance,
    decimal? StartBalance);

/// <summary>
/// The spreadsheet-like report (F-021) in <paramref name="Currency"/>, each amount at the NBU rate of its own day
/// (business rule 1). <paramref name="MonthsCounted"/> is what Avg divides by: the year's months from the person's first
/// month with data up to this one (none for a monthly report). Amounts are kept as worked out and rounded when shown
/// (ADR 0018).
/// </summary>
public sealed record Report(
    string Currency,
    IReadOnlyList<ReportMonth> Months,
    int? MonthsCounted,
    IReadOnlyList<ReportGroup> Groups,
    ReportSummary Summary);
