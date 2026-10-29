using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>What the invite page shows before the person signs up (F-028).</summary>
[ApiController]
[Route("api/invitations")]
[AllowAnonymous]
public sealed class InvitationsController(IInvitationService invitations) : ControllerBase
{
    /// <summary>
    /// Who invited and until when. A used, expired, cancelled or made-up link gets the same 404, and the limit per
    /// address keeps anyone from guessing tokens.
    /// </summary>
    [HttpGet("{token}")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType<InvitationPreview>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<InvitationPreview>> Preview(string token, CancellationToken cancellationToken)
    {
        var preview = token.Length <= AuthLimits.InviteTokenMaxLength
            ? await invitations.PreviewAsync(token, cancellationToken)
            : null;

        return preview is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: AuthController.InvitationGoneTitle)
            : Ok(preview);
    }
}
