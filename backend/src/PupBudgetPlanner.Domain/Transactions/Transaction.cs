using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Domain.Transactions;

/// <summary>What a transaction is, as the form sets it: everything but who recorded it and when.</summary>
public sealed record TransactionDetails(
    TransactionType Type,
    DateOnly Date,
    Guid AccountId,
    Guid CategoryId,
    decimal Amount,
    string? Note);

/// <summary>
/// An expense or an income on one of the person's accounts (F-018). The amount is always above zero; the type says
/// which way it goes (ARCHITECTURE.md "Data model").
/// </summary>
public sealed class Transaction
{
    public const int NoteMaxLength = 200;

    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public TransactionType Type { get; private set; }

    /// <summary>The day it happened, as the person picked it; never after today.</summary>
    public DateOnly Date { get; private set; }

    public Guid AccountId { get; private set; }

    /// <summary>A category of the type's kind (an expense category for an expense).</summary>
    public Guid CategoryId { get; private set; }

    /// <summary>Whole units of the account's currency (<see cref="Money"/>), above zero.</summary>
    public decimal Amount { get; private set; }

    /// <summary>Empty when there is none.</summary>
    public string? Note { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>When it was last changed; empty until then.</summary>
    public DateTimeOffset? UpdatedAt { get; private set; }

    /// <summary>What it does to its account's balance: an expense takes the amount away, an income adds it.</summary>
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

    /// <summary>Takes the form's values: the amount rounded to a whole unit, the note trimmed (none when blank).</summary>
    private void Set(TransactionDetails details)
    {
        var amount = Money.Whole(details.Amount);
        if (amount <= 0)
        {
            throw new ArgumentException("The amount must be more than zero.", nameof(details));
        }

        if (!Enum.IsDefined(details.Type))
        {
            throw new ArgumentException($"Unknown type '{details.Type}'.", nameof(details));
        }

        var note = details.Note?.Trim();
        Type = details.Type;
        Date = details.Date;
        AccountId = details.AccountId;
        CategoryId = details.CategoryId;
        Amount = amount;
        Note = string.IsNullOrEmpty(note) ? null : note;
    }
}
