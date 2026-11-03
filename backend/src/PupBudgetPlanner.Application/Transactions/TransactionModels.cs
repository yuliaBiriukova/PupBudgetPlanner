using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// A new transaction or the changed one, as the form sends it (F-018). A transfer (F-019) has
/// <paramref name="ToAccountId"/> and no category; <paramref name="ToAmount"/> is what the To account got, needed
/// between two currencies only (between accounts in one currency it is the amount itself).
/// </summary>
public sealed record SaveTransactionRequest(
    TransactionType Type,
    DateOnly Date,
    Guid AccountId,
    Guid? CategoryId,
    decimal Amount,
    string? Note,
    Guid? ToAccountId = null,
    decimal? ToAmount = null);

/// <summary>
/// One transaction as the lists show it, with its account's and category's names and the account's currency: an
/// archived account or category is still named. A transfer (F-019) has no category; it has its To account's name and
/// currency and what that account got instead.
/// </summary>
public sealed record TransactionItem(
    Guid Id,
    TransactionType Type,
    DateOnly Date,
    Guid AccountId,
    string AccountName,
    string Currency,
    Guid? CategoryId,
    string? CategoryName,
    decimal Amount,
    string? Note,
    Guid? ToAccountId = null,
    string? ToAccountName = null,
    string? ToCurrency = null,
    decimal? ToAmount = null);

/// <summary>An account's balance before and after a save or a delete, for the notification that counts it.</summary>
public sealed record BalanceChange(Guid AccountId, decimal Before, decimal After);

/// <summary>The saved transaction and the balances it changed: one account, or two when it moved between them.</summary>
public sealed record SavedTransaction(TransactionItem Transaction, IReadOnlyList<BalanceChange> Balances);

/// <summary>The balances a deleted transaction gave back: one account, two for a transfer.</summary>
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

    /// <summary>A transfer's To account isn't one of the person's, or it is archived (F-019).</summary>
    NoSuchToAccount,

    /// <summary>An exchange without what the To account got: between two currencies it can't be worked out.</summary>
    ToAmountMissing,
}

/// <summary>What a save came to; <paramref name="Saved"/> is set when it was saved.</summary>
public sealed record SaveTransactionResult(SaveTransactionOutcome Outcome, SavedTransaction? Saved = null);
