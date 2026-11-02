using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>An account with its balance now.</summary>
public sealed record AccountBalance(Account Account, decimal Balance);

/// <summary>The total of one currency over the accounts in use.</summary>
public sealed record CurrencyTotal(string Currency, int Accounts, decimal Total);

/// <summary>One account's transactions of one type, counted and summed (by the database).</summary>
public sealed record TransactionSum(Guid AccountId, TransactionType Type, int Count, decimal Amount);

/// <summary>
/// Balances and totals on the Accounts page (F-014). Pure, so it is tested without a database. Transactions (F-018)
/// come in as each account's net movement: incomes in, less expenses (and, with F-019, transfers in and out).
/// </summary>
public static class BalanceSheet
{
    /// <summary>Each account's net movement: what its incomes add less what its expenses take away.</summary>
    public static IReadOnlyDictionary<Guid, decimal> MovementsOf(IEnumerable<TransactionSum> sums) =>
        sums
            .GroupBy(sum => sum.AccountId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(sum => Transaction.MovementOf(sum.Type, sum.Amount)));

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
