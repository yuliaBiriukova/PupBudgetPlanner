namespace PupBudgetPlanner.Application.Transactions;

/// <summary>A person's expenses and incomes (F-018). Implemented with EF Core in Infrastructure.</summary>
public interface ITransactionService
{
    /// <summary>The Transactions page until F-020: the latest <see cref="LatestTransactions.Limit"/>.</summary>
    Task<LatestTransactions> LatestAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>What the form picks and offers when it opens.</summary>
    Task<TransactionSuggestions> SuggestionsAsync(Guid userId, CancellationToken cancellationToken);

    Task<SaveTransactionResult> CreateAsync(
        Guid userId, SaveTransactionRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Changes it. Its account and category may stay archived, but it can't move to an archived one.
    /// </summary>
    Task<SaveTransactionResult> UpdateAsync(
        Guid userId, Guid transactionId, SaveTransactionRequest request, CancellationToken cancellationToken);

    /// <summary>Null when the person has no such transaction.</summary>
    Task<DeletedTransaction?> DeleteAsync(Guid userId, Guid transactionId, CancellationToken cancellationToken);
}
