using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>Creating an account, signing in and out, and who is signed in (ADR 0003, ADR 0012).</summary>
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public sealed partial class AuthController(IAuthService auth, IAntiforgery antiforgery, ILogger<AuthController> logger)
    : ControllerBase
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
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status410Gone)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CurrentUser>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.RegisterAsync(request, cancellationToken);

        return result.Outcome switch
        {
            RegisterOutcome.Registered when result.User is not null => Ok(result.User),
            RegisterOutcome.InvitationRequired => Problem(
                statusCode: StatusCodes.Status403Forbidden, title: InviteOnlyTitle),
            RegisterOutcome.InvitationInvalid => Problem(
                statusCode: StatusCodes.Status410Gone, title: InvitationGoneTitle),
            // Neutral on purpose: it must not confirm that an account with this email exists (ADR 0012)
            _ => Problem(statusCode: StatusCodes.Status409Conflict, title: "We couldn't create an account with this email."),
        };
    }

    /// <summary>Said when sign-up needs an invite link and the request has none (F-028).</summary>
    public const string InviteOnlyTitle = "Pup Budget is invite-only for now. You need an invite link to create an account.";

    /// <summary>One message for a used, expired, cancelled or made-up link (F-028).</summary>
    public const string InvitationGoneTitle = "This invite link doesn't work any more.";

    [HttpPost("login")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType<CurrentUser>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
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
            SignInOutcome.Blocked => Problem(statusCode: StatusCodes.Status403Forbidden, title: BlockedTitle),
            _ => Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "That email and password don't match."),
        };
    }

    /// <summary>Said to a blocked person after the right password or Google (F-028).</summary>
    public const string BlockedTitle = "Your access to Pup Budget is turned off. Ask the person who invited you.";

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await auth.SignOutAsync(cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// "Continue with Google": sends the person to Google (a page navigation, not a fetch). Afterwards they land on
    /// <paramref name="returnUrl"/>, a path in the app. From the invite page, <paramref name="invite"/> carries the
    /// link's token through Google, so a new account can be created with it (F-028).
    /// </summary>
    [HttpGet("google")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<IActionResult> Google(
        string? returnUrl,
        string? invite,
        [FromServices] IAuthenticationSchemeProvider schemes,
        CancellationToken cancellationToken)
    {
        if (await schemes.GetSchemeAsync(GoogleSignIn.Scheme) is null)
        {
            LogGoogleNotConfigured(logger);
            return Redirect(GoogleSignIn.FailedPath);
        }

        var properties = new AuthenticationProperties
        {
            RedirectUri = $"/api/auth/google/complete?returnUrl={Uri.EscapeDataString(LocalPathOrHome(returnUrl))}",
        };
        // SignInManager.GetExternalLoginInfoAsync looks for the provider under this key
        properties.Items["LoginProvider"] = GoogleSignIn.Scheme;
        if (!string.IsNullOrWhiteSpace(invite) && invite.Length <= AuthLimits.InviteTokenMaxLength)
        {
            properties.Items[ExternalClaims.InviteTokenItem] = invite;
        }

        return Challenge(properties, GoogleSignIn.Scheme);
    }

    /// <summary>Google's handler comes back here with the login: sign in, or back to the sign-in page with the error.</summary>
    [HttpGet("google/complete")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<IActionResult> GoogleComplete(string? returnUrl, CancellationToken cancellationToken)
    {
        var outcome = await auth.SignInWithExternalLoginAsync(cancellationToken);
        if (outcome != ExternalSignInOutcome.SignedIn)
        {
            LogGoogleSignInFailed(logger, outcome);
            return Redirect(outcome switch
            {
                ExternalSignInOutcome.InvitationRequired => GoogleSignIn.InviteOnlyPath,
                ExternalSignInOutcome.InvitationInvalid => GoogleSignIn.InvitationGonePath,
                ExternalSignInOutcome.Blocked => GoogleSignIn.BlockedPath,
                _ => GoogleSignIn.FailedPath,
            });
        }

        return Redirect(LocalPathOrHome(returnUrl));
    }

    /// <summary>Only a path in this app, so the link can't send the person to another site.</summary>
    private static string LocalPathOrHome(string? returnUrl) =>
        returnUrl is ['/', not ('/' or '\\'), ..] ? returnUrl : "/";

    [LoggerMessage(Level = LogLevel.Warning, Message = "Continue with Google: the Google client ID and secret are not set")]
    private static partial void LogGoogleNotConfigured(ILogger logger);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Google sign-in didn't finish: {Outcome}")]
    private static partial void LogGoogleSignInFailed(ILogger logger, ExternalSignInOutcome outcome);
}
