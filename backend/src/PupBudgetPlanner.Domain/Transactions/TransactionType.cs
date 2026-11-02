namespace PupBudgetPlanner.Domain.Transactions;

/// <summary>Which way the money goes: out, in, or between two of the person's own accounts (F-019).</summary>
public enum TransactionType
{
    /// <summary>Money leaves an account, for an expense category.</summary>
    Expense,

    /// <summary>Money comes into an account, for an income category.</summary>
    Income,

    /// <summary>
    /// Money moves from one of the person's accounts to another, with no category. Between two currencies it is an
    /// exchange: each side has its own amount. Neither income nor expense in reports (business rule 2).
    /// </summary>
    Transfer,
}
