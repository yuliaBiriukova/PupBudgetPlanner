using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Reminders;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The budget reminder on the 1st as a push to the person's devices (F-033): the app's public key, a device turned on
/// or off. Each device is turned on in its own Settings.
/// </summary>
[ApiController]
[Route("api/push")]
public sealed class PushController(IPushSubscriptionService subscriptions, IOptionsMonitor<PushOptions> options)
    : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The key a browser subscribes with; none when push isn't set up on this server.</summary>
    [HttpGet("key")]
    [ProducesResponseType<PushKey>(StatusCodes.Status200OK)]
    public ActionResult<PushKey> Key() =>
        Ok(new PushKey(options.CurrentValue.IsConfigured ? options.CurrentValue.PublicKey : null));

    /// <summary>Reminds this device from now on.</summary>
    [HttpPut("subscription")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Subscribe(
        SavePushSubscriptionRequest request, CancellationToken cancellationToken)
    {
        await subscriptions.SaveAsync(UserId, request, cancellationToken);
        return NoContent();
    }

    /// <summary>Stops reminding this device.</summary>
    [HttpPost("subscription/remove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Unsubscribe(
        RemovePushSubscriptionRequest request, CancellationToken cancellationToken)
    {
        await subscriptions.RemoveAsync(UserId, request.Endpoint, cancellationToken);
        return NoContent();
    }
}

/// <summary>
/// The reminder on the 1st (F-033), started by a cron-job.org job at 09:00 Kyiv with the secret in a header, as the
/// morning clean-up (ADR 0033). A second run the same month reminds nobody again.
/// </summary>
[ApiController]
[Route("api/reminders/budget")]
[AllowAnonymous]
[RequireAntiforgeryToken(required: false)]
public sealed partial class BudgetRemindersController(
    IBudgetReminderService reminders,
    IOptionsMonitor<PushOptions> options,
    ILogger<BudgetRemindersController> logger) : ControllerBase
{
    public const string SecretHeader = "X-Reminders-Secret";

    [HttpPost]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType<ReminderReport>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ReminderReport>> Run(
        [FromHeader(Name = SecretHeader)] string? secret, CancellationToken cancellationToken)
    {
        if (!CleanupController.Matches(options.CurrentValue.RemindersSecret, secret))
        {
            LogRefused();
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "The reminder needs its secret.");
        }

        return Ok(await reminders.RunAsync(cancellationToken));
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Budget reminder refused: the secret is missing or wrong")]
    private partial void LogRefused();
}
