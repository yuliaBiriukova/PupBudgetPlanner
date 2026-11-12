namespace PupBudgetPlanner.Domain.Families;

/// <summary>
/// What the other members of a person's family see of one of their accounts (F-030). The same for every member; a new
/// account is <see cref="Everything"/>.
/// </summary>
public enum AccountShare
{
    /// <summary>The account, its balance and its transactions, as before F-030.</summary>
    Everything,

    /// <summary>The account and its balance; its transactions count in the totals by category but aren't listed.</summary>
    BalanceOnly,

    /// <summary>Nothing of it: not the account, its balance or its transactions.</summary>
    Hidden,
}

/// <summary>What the other members of a person's family see of their transactions (F-030), all of them at once.</summary>
public enum TransactionShare
{
    /// <summary>Every transaction with its account, category and note, as before F-030.</summary>
    Every,

    /// <summary>Only how much went on each category: no lines, so no notes either.</summary>
    Totals,
}
