namespace PupBudgetPlanner.Domain.Transactions;

/// <summary>Which way the money goes. F-019 adds transfers between a person's own accounts.</summary>
public enum TransactionType
{
    /// <summary>Money leaves an account, for an expense category.</summary>
    Expense,

    /// <summary>Money comes into an account, for an income category.</summary>
    Income,
}
