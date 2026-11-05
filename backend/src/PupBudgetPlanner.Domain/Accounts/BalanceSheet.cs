using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>An account with its balance now.</summary>
public sealed record AccountBalance(Account Account, decimal Balance);

/// <summary>The total of one currency over the accounts in use.</summary>
public sealed record CurrencyTotal(string Currency, int Accounts, decimal Total);

/// <summary>
/// One account's transactions of one type, counted and summed (by the database). <paramref name="Incoming"/> marks
/// the transfers that came into the account (F-019): <paramref name="Amount"/> is then what it got, their To amounts.
/// <paramref name="LastAddedAt"/> is when the latest of them was added (I-024).
/// </summary>
public sealed record TransactionSum(
    Guid AccountId,
    TransactionType Type,
    int Count,
    decimal Amount,
    bool Incoming = false,
    DateTimeOffset? LastAddedAt = null);

/// <summary>
/// Balances and totals on the Accounts page (F-014). Pure, so it is tested without a database. Transactions (F-018)
/// come in as each account's net movement: incomes and transfers in, less expenses and transfers out (F-019).
/// </summary>
public static class BalanceSheet
{
    /// <summary>
    /// Each account's net movement: what its incomes and incoming transfers add less what its expenses and outgoing
    /// transfers take away.
    /// </summary>
    public static IReadOnlyDictionary<Guid, decimal> MovementsOf(IEnumerable<TransactionSum> sums) =>
        sums
            .GroupBy(sum => sum.AccountId)
            .ToDictionary(group => group.Key, group => group.Sum(MovementOf));

    private static decimal MovementOf(TransactionSum sum) =>
        sum.Incoming ? sum.Amount : Transaction.MovementOf(sum.Type, sum.Amount);

    /// <summary>
    /// When each account was last used: its latest transaction added, of any type, a transfer's for both its accounts
    /// (I-024). The quick-add form lists the account used last first. An account with no transactions has none.
    /// </summary>
    public static IReadOnlyDictionary<Guid, DateTimeOffset> LastUsedOf(IEnumerable<TransactionSum> sums) =>
        sums
            .Where(sum => sum.LastAddedAt is not null)
            .GroupBy(sum => sum.AccountId)
            .ToDictionary(group => group.Key, group => group.Max(sum => sum.LastAddedAt!.Value));

    /// <summary>Each account's opening balance plus its movement; an account with no transactions has none.</summary>
    public static IReadOnlyList<AccountBalance> BalancesOf(
        IEnumerable<Account> accounts, IReadOnlyDictionary<Guid, decimal> movements) =>
        accounts
            .Select(account => new AccountBalance(
                account, account.OpeningBalance + movements.GetValueOrDefault(account.Id)))
            .ToList();

    /// <summary>
    /// The total of each currency over the accounts in use (archived ones are left out): the hryvnia first, then
    /// the currencies with the most accounts, then by code.
    /// </summary>
    public static IReadOnlyList<CurrencyTotal> TotalsOf(IEnumerable<AccountBalance> balances) =>
        balances
            .Where(balance => !balance.Account.IsArchived)
            .GroupBy(balance => balance.Account.Currency)
            .Select(group => new CurrencyTotal(group.Key, group.Count(), group.Sum(balance => balance.Balance)))
            .OrderByDescending(total => total.Currency == Currencies.Hryvnia)
            .ThenByDescending(total => total.Accounts)
            .ThenBy(total => total.Currency, StringComparer.Ordinal)
            .ToList();
}
