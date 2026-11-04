using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Accounts;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The signed-in person's accounts, with their balances and totals (F-014).</summary>
[ApiController]
[Route("api/accounts")]
public sealed class AccountsController(IAccountService accounts) : ControllerBase
{
    private const string NoSuchAccount = "There is no such account.";

    /// <summary>The form shows its own text under the name (I-020); this is for anyone else calling the API.</summary>
    private const string Copy = "You already have this account. Give it another name.";

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Everything the Accounts page shows, and what its form offers.</summary>
    [HttpGet]
    [ProducesResponseType<AccountsOverview>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AccountsOverview>> Overview(CancellationToken cancellationToken) =>
        Ok(await accounts.OverviewAsync(UserId, cancellationToken));

    /// <summary>
    /// "In total, in UAH": the accounts in use together in the report currency at today's NBU rates (F-017), or the
    /// latest earlier ones, marked.
    /// </summary>
    [HttpGet("total")]
    [ProducesResponseType<AccountsTotal>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AccountsTotal>> Total(CancellationToken cancellationToken) =>
        Ok(await accounts.TotalAsync(UserId, cancellationToken));

    [HttpPost]
    [ProducesResponseType<AccountItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AccountItem>> Create(SaveAccountRequest request, CancellationToken cancellationToken) =>
        ResultOf(await accounts.CreateAsync(UserId, request, cancellationToken));

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AccountItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AccountItem>> Update(
        Guid id, SaveAccountRequest request, CancellationToken cancellationToken) =>
        ResultOf(await accounts.UpdateAsync(UserId, id, request, cancellationToken));

    /// <summary>Takes it out of the totals and the pickers; its history stays.</summary>
    [HttpPost("{id:guid}/archive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken) =>
        await accounts.ArchiveAsync(UserId, id, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount);

    /// <summary>Brings it back, unless an account in use looks just like it (409, I-020).</summary>
    [HttpPost("{id:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken) =>
        await accounts.RestoreAsync(UserId, id, cancellationToken) switch
        {
            RestoreAccountOutcome.Restored => NoContent(),
            RestoreAccountOutcome.Copy => Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "You already have this account in use. Rename it first, then restore this one."),
            _ => Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount),
        };

    /// <summary>
    /// Removes it for good (I-011); the person's own sources and banks stay. Only an account without transactions.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        await accounts.DeleteAsync(UserId, id, cancellationToken) switch
        {
            DeleteAccountOutcome.Deleted => NoContent(),
            DeleteAccountOutcome.HasTransactions => Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "It has transactions, so it can only be archived."),
            _ => Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount),
        };

    /// <summary>A copy is a mistake in the name, a 400 like the validators' (<c>ValidationFilter</c>).</summary>
    private ActionResult<AccountItem> ResultOf(SaveAccountResult result)
    {
        switch (result.Outcome)
        {
            case SaveAccountOutcome.Saved:
                return Ok(result.Account);
            case SaveAccountOutcome.Copy:
                ModelState.AddModelError(JsonNamingPolicy.CamelCase.ConvertName(nameof(SaveAccountRequest.Name)), Copy);
                return ValidationProblem(ModelState);
            case SaveAccountOutcome.CurrencyFixed:
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "The currency can't be changed: the account has transactions.");
            default:
                return Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount);
        }
    }
}
