using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>Creating an account, signing in and out, and who is signed in (ADR 0003, ADR 0012).</summary>
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public sealed class AuthController(IAuthService auth, IAntiforgery antiforgery) : ControllerBase
{
    /// <summary>The signed-in person, or 204 when nobody is. Also issues the antiforgery token for this person.</summary>
    [HttpGet("me")]
    [ProducesResponseType<CurrentUser>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<CurrentUser>> Me(CancellationToken cancellationToken)
    {
        AntiforgeryToken.Issue(antiforgery, HttpContext);
        var user = await auth.GetCurrentUserAsync(User, cancellationToken);

        return user is null ? NoContent() : Ok(user);
    }

    [HttpPost("register")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType<CurrentUser>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CurrentUser>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.RegisterAsync(request, cancellationToken);

        return result.Outcome == RegisterOutcome.Registered && result.User is not null
            ? Ok(result.User)
            // Neutral on purpose: it must not confirm that an account with this email exists (ADR 0012)
            : Problem(statusCode: StatusCodes.Status409Conflict, title: "We couldn't create an account with this email.");
    }

    [HttpPost("login")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType<CurrentUser>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CurrentUser>> Login(SignInRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.SignInAsync(request, cancellationToken);

        return result.Outcome switch
        {
            SignInOutcome.SignedIn when result.User is not null => Ok(result.User),
            SignInOutcome.LockedOut => Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: "Too many attempts. Wait a few minutes and try again."),
            _ => Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "That email and password don't match."),
        };
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await auth.SignOutAsync(cancellationToken);
        return NoContent();
    }
}
