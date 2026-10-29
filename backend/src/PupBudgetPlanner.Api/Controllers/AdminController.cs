using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Access;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The admin's People page: everyone with access, taking it away, and invite links (F-028, ADR 0016).</summary>
[ApiController]
[Route("api/admin")]
[Authorize(Policy = AdminPolicy.Name)]
public sealed class AdminController(IPeopleService people, IInvitationService invitations) : ControllerBase
{
    private Guid AdminId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("people")]
    [ProducesResponseType<IReadOnlyList<PersonItem>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PersonItem>>> People(CancellationToken cancellationToken) =>
        Ok(await people.ListAsync(AdminId, cancellationToken));

    /// <summary>Signs the people out everywhere and stops them signing in; their data stays.</summary>
    [HttpPost("people/block")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Block(PeopleRequest request, CancellationToken cancellationToken) =>
        ResultOf(await people.BlockAsync(AdminId, request, cancellationToken));

    [HttpPost("people/unblock")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unblock(PeopleRequest request, CancellationToken cancellationToken) =>
        ResultOf(await people.UnblockAsync(AdminId, request, cancellationToken));

    /// <summary>Deletes the accounts and everything in them. The confirmation is the page's job.</summary>
    [HttpPost("people/delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(PeopleRequest request, CancellationToken cancellationToken) =>
        ResultOf(await people.DeleteAsync(AdminId, request, cancellationToken));

    [HttpGet("invitations")]
    [ProducesResponseType<IReadOnlyList<InvitationItem>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<InvitationItem>>> Invitations(CancellationToken cancellationToken) =>
        Ok(await invitations.ListAsync(cancellationToken));

    /// <summary>A new link. Its token is in this answer only: the page shows it once.</summary>
    [HttpPost("invitations")]
    [ProducesResponseType<CreatedInvitation>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreatedInvitation>> CreateInvitation(
        CreateInvitationRequest request, CancellationToken cancellationToken) =>
        Ok(await invitations.CreateAsync(AdminId, request, cancellationToken));

    [HttpPost("invitations/{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelInvitation(Guid id, CancellationToken cancellationToken) =>
        await invitations.CancelAsync(id, cancellationToken) switch
        {
            CancelInvitationOutcome.Cancelled => NoContent(),
            CancelInvitationOutcome.NotWaiting => Problem(
                statusCode: StatusCodes.Status409Conflict, title: "This link was already used, cancelled or expired."),
            _ => Problem(statusCode: StatusCodes.Status404NotFound, title: "There is no such link."),
        };

    private IActionResult ResultOf(PeopleActionOutcome outcome) => outcome switch
    {
        PeopleActionOutcome.Done => NoContent(),
        PeopleActionOutcome.IncludesYou => Problem(
            statusCode: StatusCodes.Status400BadRequest, title: "You can't block or delete your own account here."),
        _ => Problem(statusCode: StatusCodes.Status404NotFound, title: "Someone you picked no longer has an account."),
    };
}
