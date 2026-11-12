using PupBudgetPlanner.Domain.ExchangeRates;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// A day's totals: what the calendar colours it by and what its receipt's foot says. <paramref name="Count"/> is all its
/// transactions the filters find, transfers too: the receipt says how many are still loading.
/// <paramref name="Transfers"/> is how many of them are transfers: the calendar marks the day with a blue dot, as a
/// green one marks income (owner's review of PR #49).
/// </summary>
public sealed record DayTotal(DateOnly Date, decimal Spent, decimal Received, int Count, int Transfers = 0);

/// <summary>A category's line in "Where it went" (or "Where it came from"): what went on it in the period.</summary>
public sealed record CategoryTotal(Guid CategoryId, string Name, decimal Amount);

/// <summary>
/// The transactions the filters find, counted and summed by the database: one day's, one type's, one account
/// currency's, one category's (none for a transfer). What <see cref="TransactionSummary.Of"/> is worked out from.
/// <paramref name="Listed"/> is false for transactions the viewer sees only in the totals, not as lines (F-030).
/// </summary>
public sealed record SummaryRow(
    DateOnly Date,
    TransactionType Type,
    string Currency,
    Guid? CategoryId,
    int Count,
    decimal Amount,
    bool Listed = true);

/// <summary>
/// The Transactions page's totals (F-020): what the period's transactions came to, each day's, and where the money went.
/// Amounts are in <paramref name="Currency"/>: the report currency, each at the NBU rate of its own day (PRODUCT.md
/// business rule 1), or with one account picked that account's own. Transfers are neither spent nor received (business
/// rule 2), but they are counted. <paramref name="Categories"/> leave the picked category out of their filters, so
/// another one can be picked from them; they are expense categories, income ones with Income picked, none with
/// Transfers. <paramref name="RatesMissing"/>: some amounts in another currency had no rate and aren't in the totals.
/// Amounts are kept as they are and rounded when shown (ADR 0018).
/// </summary>
public sealed record TransactionSummary(
    string Currency,
    decimal Spent,
    decimal Received,
    int Count,
    IReadOnlyList<DayTotal> Days,
    IReadOnlyList<CategoryTotal> Categories,
    bool RatesMissing)
{
    /// <summary>
    /// Works the summary out from the rows of every filter but the category (<paramref name="categoryId"/> picks it
    /// here) and the NBU rates of the rows' days (hryvnias for one unit, by code); a day without rates has none.
    /// Pure, so it is tested without a database.
    /// </summary>
    public static TransactionSummary Of(
        IReadOnlyList<SummaryRow> rows,
        string currency,
        IReadOnlyDictionary<DateOnly, IReadOnlyDictionary<string, decimal>> rates,
        Guid? categoryId,
        TransactionType? type,
        IReadOnlyDictionary<Guid, string> categoryNames)
    {
        var missing = false;
        decimal? InCurrency(SummaryRow row)
        {
            if (row.Currency == currency)
            {
                return row.Amount;
            }

            var rate = rates.TryGetValue(row.Date, out var day) ? Conversion.Rate(row.Currency, currency, day) : null;
            if (rate is null)
            {
                missing = true;
            }

            return row.Amount * rate;
        }

        var picked = rows.Where(row => categoryId is null || row.CategoryId == categoryId).ToList();
        // The days and the count are the lines' (the calendar, the receipts); the totals count every row (F-030)
        var days = picked
            .Where(row => row.Listed)
            .GroupBy(row => row.Date)
            .OrderBy(day => day.Key)
            .Select(day => new DayTotal(
                day.Key,
                SumOf(day, TransactionType.Expense, InCurrency),
                SumOf(day, TransactionType.Income, InCurrency),
                day.Sum(row => row.Count),
                day.Where(row => row.Type == TransactionType.Transfer).Sum(row => row.Count)))
            .ToList();

        var kind = type == TransactionType.Income ? TransactionType.Income : TransactionType.Expense;
        var categories = type == TransactionType.Transfer
            ? []
            : rows
                .Where(row => row.Type == kind && row.CategoryId is not null)
                .GroupBy(row => row.CategoryId!.Value)
                .Select(category => new CategoryTotal(
                    category.Key,
                    categoryNames.GetValueOrDefault(category.Key, string.Empty),
                    category.Sum(row => InCurrency(row) ?? 0)))
                .OrderByDescending(category => category.Amount)
                .ThenBy(category => category.Name, StringComparer.CurrentCulture)
                .ToList();

        return new TransactionSummary(
            currency,
            SumOf(picked, TransactionType.Expense, InCurrency),
            SumOf(picked, TransactionType.Income, InCurrency),
            days.Sum(day => day.Count),
            days,
            categories,
            missing);
    }

    private static decimal SumOf(
        IEnumerable<SummaryRow> rows, TransactionType type, Func<SummaryRow, decimal?> inCurrency) =>
        rows.Where(row => row.Type == type).Sum(row => inCurrency(row) ?? 0);
}
