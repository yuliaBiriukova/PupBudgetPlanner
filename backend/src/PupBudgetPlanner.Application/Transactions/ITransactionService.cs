namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// A person's expenses and incomes (F-018), transfers (F-019) and their list (F-020). Implemented with EF Core in
/// Infrastructure.
/// </summary>
public interface ITransactionService
{
    /// <summary>The Transactions page (F-020): the ones the filters find, a page at a time, the latest first.</summary>
    Task<TransactionPage> ListAsync(
        Guid userId, TransactionFilter filter, int offset, int limit, CancellationToken cancellationToken);

    /// <summary>What the ones the filters find come to: the page's totals, calendar and categories (F-020).</summary>
    Task<TransactionSummary> SummaryAsync(Guid userId, TransactionFilter filter, CancellationToken cancellationToken);

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
