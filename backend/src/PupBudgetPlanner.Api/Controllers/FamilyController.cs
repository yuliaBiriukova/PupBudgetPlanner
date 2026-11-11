using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Families;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The signed-in person's family (F-023): starting, renaming, invite links, removing, leaving and joining. The page
/// knows who may do what and says it in its own words; these texts are for anyone else calling the API.
/// </summary>
[ApiController]
[Route("api/family")]
public sealed class FamilyController(IFamilyService families) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The person's family, or 204 when they are in none.</summary>
    [HttpGet]
    [ProducesResponseType<FamilyView>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<FamilyView>> Get(CancellationToken cancellationToken) =>
        await families.GetAsync(UserId, cancellationToken) is { } family ? Ok(family) : NoContent();

    /// <summary>Starts a family with the person as its owner.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Start(StartFamilyRequest request, CancellationToken cancellationToken) =>
        ResultOf(await families.StartAsync(UserId, request, cancellationToken));

    [HttpPut("name")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Rename(RenameFamilyRequest request, CancellationToken cancellationToken) =>
        ResultOf(await families.RenameAsync(UserId, request, cancellationToken));

    /// <summary>A new link for one person. Its token is in this answer only: the page shows it once.</summary>
    [HttpPost("invitations")]
    [ProducesResponseType<CreatedInvitation>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CreatedInvitation>> Invite(
        CreateInvitationRequest request, CancellationToken cancellationToken)
    {
        var (outcome, invitation) = await families.InviteAsync(UserId, request, cancellationToken);
        return invitation is null ? ResultOf(outcome) : Ok(invitation);
    }

    [HttpPost("invitations/{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelInvitation(Guid id, CancellationToken cancellationToken) =>
        ResultOf(await families.CancelInvitationAsync(UserId, id, cancellationToken));

    /// <summary>The owner takes someone out of the family; nothing of theirs is deleted.</summary>
    [HttpPost("members/{id:guid}/remove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Remove(Guid id, CancellationToken cancellationToken) =>
        ResultOf(await families.RemoveAsync(UserId, id, cancellationToken));

    /// <summary>
    /// Leaves the family. An owner who leaves others behind names who looks after it next; the last one to leave
    /// deletes it. Nothing of anyone's is deleted.
    /// </summary>
    [HttpPost("leave")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Leave(LeaveFamilyRequest request, CancellationToken cancellationToken) =>
        ResultOf(await families.LeaveAsync(UserId, request, cancellationToken));

    /// <summary>
    /// Joins the family of an invite link and uses the link up. A used, expired, cancelled, made-up or admin's link
    /// gets the same 410 as on sign-up.
    /// </summary>
    [HttpPost("join")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status410Gone)]
    public async Task<IActionResult> Join(JoinFamilyRequest request, CancellationToken cancellationToken) =>
        ResultOf(await families.JoinAsync(UserId, request, cancellationToken));

    private ActionResult ResultOf(FamilyActionOutcome outcome) => outcome switch
    {
        FamilyActionOutcome.Done => NoContent(),
        FamilyActionOutcome.NoFamily => Problem(
            statusCode: StatusCodes.Status404NotFound, title: "You're not in a family."),
        FamilyActionOutcome.AlreadyInFamily => Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "You're already in a family. A person can be in one family at a time."),
        FamilyActionOutcome.NotOwner => Problem(
            statusCode: StatusCodes.Status403Forbidden, title: "Only the family's owner can do this."),
        FamilyActionOutcome.NotWaiting => Problem(
            statusCode: StatusCodes.Status409Conflict, title: "This link was already used, cancelled or expired."),
        FamilyActionOutcome.IsOwner => Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "You can't remove yourself. Leave the family and name who looks after it next."),
        FamilyActionOutcome.NewOwnerNeeded => Problem(
            statusCode: StatusCodes.Status400BadRequest, title: "Pick someone in the family to look after it next."),
        FamilyActionOutcome.InvitationGone => Problem(
            statusCode: StatusCodes.Status410Gone, title: AuthController.InvitationGoneTitle),
        _ => Problem(statusCode: StatusCodes.Status404NotFound, title: "There is no such person or link in your family."),
    };
}
