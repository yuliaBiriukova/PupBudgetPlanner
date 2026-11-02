using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Domain.Transactions;

/// <summary>
/// What a transaction is, as the form sets it: everything but who recorded it and when. A transfer (F-019) has
/// <paramref name="ToAccountId"/> and <paramref name="ToAmount"/> and no category; an expense or an income the other
/// way round.
/// </summary>
public sealed record TransactionDetails(
    TransactionType Type,
    DateOnly Date,
    Guid AccountId,
    Guid? CategoryId,
    decimal Amount,
    string? Note,
    Guid? ToAccountId = null,
    decimal? ToAmount = null);

/// <summary>
/// An expense or an income on one of the person's accounts (F-018), or a transfer between two of them (F-019). The
/// amount is always above zero; the type says which way it goes (ARCHITECTURE.md "Data model"). A transfer is one row
/// with both accounts, so it is saved, changed and deleted as one (ADR 0023).
/// </summary>
public sealed class Transaction
{
    public const int NoteMaxLength = 200;

    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public TransactionType Type { get; private set; }

    /// <summary>The day it happened, as the person picked it; never after today.</summary>
    public DateOnly Date { get; private set; }

    /// <summary>The account it is on; for a transfer, the one the money leaves (From).</summary>
    public Guid AccountId { get; private set; }

    /// <summary>A category of the type's kind (an expense category for an expense); a transfer has none.</summary>
    public Guid? CategoryId { get; private set; }

    /// <summary>Whole units of the account's currency (<see cref="Money"/>), above zero.</summary>
    public decimal Amount { get; private set; }

    /// <summary>A transfer's other account, the one the money goes to (To); empty for an expense or an income.</summary>
    public Guid? ToAccountId { get; private set; }

    /// <summary>
    /// What a transfer's To account got, in whole units of its currency: the amount itself between accounts in one
    /// currency, the bank's own figure for an exchange. Empty for an expense or an income.
    /// </summary>
    public decimal? ToAmount { get; private set; }

    /// <summary>Empty when there is none.</summary>
    public string? Note { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When it was last changed; empty until then.</summary>
    public DateTimeOffset? UpdatedAt { get; private set; }

    /// <summary>
    /// What it does to its account's balance: an expense or a transfer takes the amount away, an income adds it. A
    /// transfer also adds <see cref="ToAmount"/> to its To account.
    /// </summary>
    public decimal Movement => MovementOf(Type, Amount);

    public static decimal MovementOf(TransactionType type, decimal amount) =>
        type == TransactionType.Income ? amount : -amount;

    /// <summary>The kind of category the type takes: an expense category for an expense, an income one for an income.</summary>
    public static CategoryKind CategoryKindOf(TransactionType type) =>
        type == TransactionType.Income ? CategoryKind.Income : CategoryKind.Expense;

    public static Transaction Create(Guid userId, TransactionDetails details, DateTimeOffset now)
    {
        var transaction = new Transaction { Id = Guid.CreateVersion7(now), UserId = userId, CreatedAt = now };
        transaction.Set(details);
        return transaction;
    }

    public void Update(TransactionDetails details, DateTimeOffset now)
    {
        Set(details);
        UpdatedAt = now;
    }

    /// <summary>Takes the form's values: the amounts rounded to a whole unit, the note trimmed (none when blank).</summary>
    private void Set(TransactionDetails details)
    {
        if (!Enum.IsDefined(details.Type))
        {
            throw new ArgumentException($"Unknown type '{details.Type}'.", nameof(details));
        }

        var amount = Money.Whole(details.Amount);
        if (amount <= 0)
        {
            throw new ArgumentException("The amount must be more than zero.", nameof(details));
        }

        decimal? toAmount = null;
        if (details.Type == TransactionType.Transfer)
        {
            if (details.ToAccountId is not { } toAccountId || toAccountId == Guid.Empty)
            {
                throw new ArgumentException("A transfer needs the account the money goes to.", nameof(details));
            }

            if (toAccountId == details.AccountId)
            {
                throw new ArgumentException("A transfer goes between two different accounts.", nameof(details));
            }

            if (details.CategoryId is not null)
            {
                throw new ArgumentException("A transfer has no category.", nameof(details));
            }

            toAmount = Money.Whole(details.ToAmount ?? 0);
            if (toAmount <= 0)
            {
                throw new ArgumentException("The amount the To account got must be more than zero.", nameof(details));
            }
        }
        else
        {
            if (details.CategoryId is null || details.CategoryId == Guid.Empty)
            {
                throw new ArgumentException("An expense or an income needs a category.", nameof(details));
            }

            if (details.ToAccountId is not null || details.ToAmount is not null)
            {
                throw new ArgumentException("Only a transfer goes to another account.", nameof(details));
            }
        }

        var note = details.Note?.Trim();
        Type = details.Type;
        Date = details.Date;
        AccountId = details.AccountId;
        CategoryId = details.CategoryId;
        Amount = amount;
        ToAccountId = details.ToAccountId;
        ToAmount = toAmount;
        Note = string.IsNullOrEmpty(note) ? null : note;
    }
}
