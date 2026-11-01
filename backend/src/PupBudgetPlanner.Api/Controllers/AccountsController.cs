using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Accounts;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The signed-in person's accounts, with their balances and totals (F-014).</summary>
[ApiController]
[Route("api/accounts")]
public sealed class AccountsController(IAccountService accounts) : ControllerBase
{
    private const string NoSuchAccount = "There is no such account.";

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
        Ok(await accounts.CreateAsync(UserId, request, cancellationToken));

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AccountItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountItem>> Update(
        Guid id, SaveAccountRequest request, CancellationToken cancellationToken) =>
        await accounts.UpdateAsync(UserId, id, request, cancellationToken) is { } account
            ? Ok(account)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount);

    /// <summary>Takes it out of the totals and the pickers; its history stays.</summary>
    [HttpPost("{id:guid}/archive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken) =>
        await accounts.ArchiveAsync(UserId, id, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount);

    [HttpPost("{id:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken) =>
        await accounts.RestoreAsync(UserId, id, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount);

    /// <summary>Removes it for good (I-011); the person's own sources and banks stay.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        await accounts.DeleteAsync(UserId, id, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchAccount);
}
