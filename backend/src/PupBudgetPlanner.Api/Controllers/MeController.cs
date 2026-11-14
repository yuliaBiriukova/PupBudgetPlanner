using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>Deleting one's own account (F-027): what goes, "Confirm with Google" and the deletion itself.</summary>
[ApiController]
[Route("api/me")]
public sealed partial class MeController(
    IAccountDeletionService deletion, IAuthService auth, ILogger<MeController> logger) : ControllerBase
{
    private const string NoAccount = "There is no such account.";

    public const string AdminTitle =
        "You look after Pup Budget, so your account can't be deleted here: without you nobody could be invited.";

    public const string LockedOutTitle = "Too many attempts. Wait a few minutes and try again.";

    public const string GoogleTitle = "Confirm with Google first.";

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The counts the confirmation shows, how it is confirmed, and whether the account can be deleted.</summary>
    [HttpGet("deletion")]
    [ProducesResponseType<DeletionSummary>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeletionSummary>> Deletion(CancellationToken cancellationToken) =>
        await deletion.SummaryAsync(UserId, GoogleConfirmation.IsConfirmed(HttpContext, UserId), cancellationToken)
            is { } summary
            ? Ok(summary)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: NoAccount);

    /// <summary>
    /// "Confirm with Google" (a page navigation): Google, then back to Settings with the dialog open. It signs nobody
    /// in; it only proves the person at the screen is the account's owner.
    /// </summary>
    [HttpGet("delete/google")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<IActionResult> ConfirmWithGoogle([FromServices] IAuthenticationSchemeProvider schemes)
    {
        if (await schemes.GetSchemeAsync(GoogleSignIn.Scheme) is null)
        {
            return Redirect(GoogleConfirmation.FailedPath);
        }

        var properties = new AuthenticationProperties { RedirectUri = "/api/me/delete/google/complete" };
        properties.Items["LoginProvider"] = GoogleSignIn.Scheme;
        properties.Items[GoogleSignIn.CancelledPathItem] = GoogleConfirmation.CancelledPath;
        properties.Items[GoogleSignIn.FailedPathItem] = GoogleConfirmation.FailedPath;
        return Challenge(properties, GoogleSignIn.Scheme);
    }

    /// <summary>Back from Google: confirmed when it is this person's own Google account.</summary>
    [HttpGet("delete/google/complete")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public async Task<IActionResult> ConfirmWithGoogleComplete(CancellationToken cancellationToken)
    {
        if (!await deletion.IsOwnGoogleLoginAsync(UserId, cancellationToken))
        {
            LogGoogleConfirmationFailed(logger);
            return Redirect(GoogleConfirmation.FailedPath);
        }

        GoogleConfirmation.Set(HttpContext, UserId);
        return Redirect(GoogleConfirmation.ConfirmedPath);
    }

    /// <summary>Deletes the account and everything in it, then signs out (other devices within a minute).</summary>
    [HttpPost("delete")]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Delete(DeleteMyAccountRequest request, CancellationToken cancellationToken)
    {
        var outcome = await deletion.DeleteAsync(
            UserId, request, GoogleConfirmation.IsConfirmed(HttpContext, UserId), cancellationToken);
        switch (outcome)
        {
            case DeleteMyAccountOutcome.Deleted:
                GoogleConfirmation.Clear(HttpContext);
                await auth.SignOutAsync(cancellationToken);
                return NoContent();
            case DeleteMyAccountOutcome.NotFound:
                return Problem(statusCode: StatusCodes.Status404NotFound, title: NoAccount);
            case DeleteMyAccountOutcome.IsAdmin:
                return Problem(statusCode: StatusCodes.Status403Forbidden, title: AdminTitle);
            case DeleteMyAccountOutcome.LockedOut:
                return Problem(statusCode: StatusCodes.Status429TooManyRequests, title: LockedOutTitle);
            case DeleteMyAccountOutcome.GoogleNotConfirmed:
                return Problem(statusCode: StatusCodes.Status409Conflict, title: GoogleTitle);
        }

        var (field, message) = outcome switch
        {
            DeleteMyAccountOutcome.WrongWord => ("word", $"Type {AccountDeletionRules.Word} to confirm."),
            DeleteMyAccountOutcome.PasswordNeeded => ("password", "Enter your password."),
            DeleteMyAccountOutcome.WrongPassword => ("password", "That password isn't right."),
            _ => ("newOwnerId", "Pick who looks after the family."),
        };
        ModelState.AddModelError(field, message);
        return ValidationProblem(ModelState);
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Confirm with Google before deleting: not the account's own Google")]
    private static partial void LogGoogleConfirmationFailed(ILogger logger);
}
