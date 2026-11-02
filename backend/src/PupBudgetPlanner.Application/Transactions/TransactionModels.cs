using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>A new transaction or the changed one, as the form sends it (F-018).</summary>
public sealed record SaveTransactionRequest(
    TransactionType Type,
    DateOnly Date,
    Guid AccountId,
    Guid CategoryId,
    decimal Amount,
    string? Note);

/// <summary>
/// One transaction as the lists show it, with its account's and category's names and the account's currency: an
/// archived account or category is still named.
/// </summary>
public sealed record TransactionItem(
    Guid Id,
    TransactionType Type,
    DateOnly Date,
    Guid AccountId,
    string AccountName,
    string Currency,
    Guid CategoryId,
    string CategoryName,
    decimal Amount,
    string? Note);

/// <summary>
/// The Transactions page until F-020 brings the full list: the latest transactions, newest day first and, within a
/// day, the last added first.
/// </summary>
public sealed record LatestTransactions(IReadOnlyList<TransactionItem> Items)
{
    public const int Limit = 50;
}

/// <summary>An account's balance before and after a save or a delete, for the notification that counts it.</summary>
public sealed record BalanceChange(Guid AccountId, decimal Before, decimal After);

/// <summary>The saved transaction and the balances it changed: one account, or two when it moved between them.</summary>
public sealed record SavedTransaction(TransactionItem Transaction, IReadOnlyList<BalanceChange> Balances);

/// <summary>The balance a deleted transaction gave back.</summary>
public sealed record DeletedTransaction(IReadOnlyList<BalanceChange> Balances);

public enum SaveTransactionOutcome
{
    Saved,

    /// <summary>The person has no such transaction (a change only).</summary>
    NotFound,

    /// <summary>The account isn't one of the person's, or it is archived.</summary>
    NoSuchAccount,

    /// <summary>The category isn't one of the person's, is archived, or is of the other kind.</summary>
    NoSuchCategory,
}

/// <summary>What a save came to; <paramref name="Saved"/> is set when it was saved.</summary>
public sealed record SaveTransactionResult(SaveTransactionOutcome Outcome, SavedTransaction? Saved = null);
