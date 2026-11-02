using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Transactions;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The signed-in person's expenses and incomes (F-018) and transfers (F-019).</summary>
[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(ITransactionService transactions) : ControllerBase
{
    private const string NoSuchTransaction = "There is no such transaction.";

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The latest transactions: the Transactions page until F-020 brings the full list.</summary>
    [HttpGet]
    [ProducesResponseType<LatestTransactions>(StatusCodes.Status200OK)]
    public async Task<ActionResult<LatestTransactions>> Latest(CancellationToken cancellationToken) =>
        Ok(await transactions.LatestAsync(UserId, cancellationToken));

    /// <summary>What the form picks and offers when it opens: the last accounts and categories, the most used.</summary>
    [HttpGet("suggestions")]
    [ProducesResponseType<TransactionSuggestions>(StatusCodes.Status200OK)]
    public async Task<ActionResult<TransactionSuggestions>> Suggestions(CancellationToken cancellationToken) =>
        Ok(await transactions.SuggestionsAsync(UserId, cancellationToken));

    [HttpPost]
    [ProducesResponseType<SavedTransaction>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SavedTransaction>> Create(
        SaveTransactionRequest request, CancellationToken cancellationToken) =>
        ResultOf(await transactions.CreateAsync(UserId, request, cancellationToken));

    [HttpPut("{id:guid}")]
    [ProducesResponseType<SavedTransaction>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SavedTransaction>> Update(
        Guid id, SaveTransactionRequest request, CancellationToken cancellationToken) =>
        ResultOf(await transactions.UpdateAsync(UserId, id, request, cancellationToken));

    /// <summary>Deletes it for good; the answer has the balances it gave back (two for a transfer).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType<DeletedTransaction>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeletedTransaction>> Delete(Guid id, CancellationToken cancellationToken) =>
        await transactions.DeleteAsync(UserId, id, cancellationToken) is { } deleted
            ? Ok(deleted)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchTransaction);

    /// <summary>The form only offers the person's accounts and categories, so another one is a bad request.</summary>
    private ActionResult<SavedTransaction> ResultOf(SaveTransactionResult result) => result.Outcome switch
    {
        SaveTransactionOutcome.Saved => Ok(result.Saved),
        SaveTransactionOutcome.NoSuchAccount => FieldProblem(
            nameof(SaveTransactionRequest.AccountId), "Pick one of your accounts in use."),
        SaveTransactionOutcome.NoSuchCategory => FieldProblem(
            nameof(SaveTransactionRequest.CategoryId), "Pick one of your categories for this type."),
        SaveTransactionOutcome.NoSuchToAccount => FieldProblem(
            nameof(SaveTransactionRequest.ToAccountId), "Pick one of your accounts in use to move the money to."),
        SaveTransactionOutcome.ToAmountMissing => FieldProblem(
            nameof(SaveTransactionRequest.ToAmount), "Enter how much the account the money goes to got."),
        _ => Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchTransaction),
    };

    /// <summary>A 400 like the validators' (<c>ValidationFilter</c>): the field in camelCase, as in the JSON.</summary>
    private ActionResult FieldProblem(string field, string message)
    {
        ModelState.AddModelError(System.Text.Json.JsonNamingPolicy.CamelCase.ConvertName(field), message);
        return ValidationProblem(ModelState);
    }
}
