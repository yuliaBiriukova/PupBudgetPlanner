using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The signed-in person's expenses and incomes (F-018), transfers (F-019) and their list (F-020).</summary>
[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(
    ITransactionService transactions, IValidator<TransactionFilter> filterValidator) : ControllerBase
{
    private const string NoSuchTransaction = "There is no such transaction.";

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// The Transactions page (F-020): the ones the filters find, newest day first, <paramref name="limit"/> at a time
    /// from <paramref name="offset"/>; the answer says where the next page starts.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<TransactionPage>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TransactionPage>> List(
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] Guid? accountId = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] TransactionType? type = null,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = TransactionPage.DefaultLimit)
    {
        var filter = new TransactionFilter(from, to, accountId, categoryId, type);
        Check(filter);
        if (offset < 0)
        {
            ModelState.AddModelError(nameof(offset), "Start at 0 or after it.");
        }

        if (limit is < 1 or > TransactionPage.MaxLimit)
        {
            ModelState.AddModelError(nameof(limit), $"Ask for 1 to {TransactionPage.MaxLimit} at a time.");
        }

        return ModelState.IsValid
            ? Ok(await transactions.ListAsync(UserId, filter, offset, limit, cancellationToken))
            : ValidationProblem(ModelState);
    }

    /// <summary>
    /// What the ones the filters find come to (F-020): spent and received, each day's, and each category's, in the
    /// report currency at the NBU rates of their days (one account picked: in its own).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType<TransactionSummary>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TransactionSummary>> Summary(
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] Guid? accountId = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] TransactionType? type = null)
    {
        var filter = new TransactionFilter(from, to, accountId, categoryId, type);
        Check(filter);

        return ModelState.IsValid
            ? Ok(await transactions.SummaryAsync(UserId, filter, cancellationToken))
            : ValidationProblem(ModelState);
    }

    /// <summary>
    /// The filters come as separate query values (camelCase, like the JSON), so their validator runs here rather than
    /// in <c>ValidationFilter</c>.
    /// </summary>
    private void Check(TransactionFilter filter)
    {
        foreach (var error in filterValidator.Validate(filter).Errors)
        {
            ModelState.AddModelError(JsonNamingPolicy.CamelCase.ConvertName(error.PropertyName), error.ErrorMessage);
        }
    }

    /// <summary>What the form picks and offers when it opens: the last accounts and categories, the most used.</summary>
    [HttpGet("suggestions")]
    [ProducesResponseType<TransactionSuggestions>(StatusCodes.Status200OK)]
    public async Task<ActionResult<TransactionSuggestions>> Suggestions(CancellationToken cancellationToken) =>
        Ok(await transactions.SuggestionsAsync(UserId, cancellationToken));

    /// <summary>
    /// The Note field's suggestions (I-017): the person's own earlier notes of the type that have <paramref name="text"/>
    /// in them, ignoring case, at most 5, the ones that start with it first. None for an empty text.
    /// </summary>
    [HttpGet("notes")]
    [ProducesResponseType<IReadOnlyList<UsedNote>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<UsedNote>>> Notes(
        [FromQuery] TransactionType type, CancellationToken cancellationToken, [FromQuery] string? text = null)
    {
        if (!Enum.IsDefined(type))
        {
            ModelState.AddModelError(nameof(type), "Pick expense, income or transfer.");
        }

        if (text?.Length > Transaction.NoteMaxLength)
        {
            ModelState.AddModelError(nameof(text), $"A note is at most {Transaction.NoteMaxLength} characters.");
        }

        return ModelState.IsValid
            ? Ok(await transactions.NotesAsync(UserId, type, text ?? "", cancellationToken))
            : ValidationProblem(ModelState);
    }

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
