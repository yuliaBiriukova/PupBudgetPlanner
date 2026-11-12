using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Application.Cleanup;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The morning clean-up (I-006, ADR 0033), started by the cron-job.org job with the secret in a header. Nobody signs in
/// here: no cookie, so no antiforgery token either; the secret is what keeps anyone who finds the address out.
/// </summary>
[ApiController]
[Route("api/cleanup")]
[AllowAnonymous]
[RequireAntiforgeryToken(required: false)]
public sealed partial class CleanupController(
    ICleanupService cleanup,
    IOptionsMonitor<CleanupOptions> options,
    ILogger<CleanupController> logger) : ControllerBase
{
    public const string SecretHeader = "X-Cleanup-Secret";

    /// <summary>Deletes outdated data and says how much; a second run the same day deletes nothing more.</summary>
    [HttpPost]
    [EnableRateLimiting(AuthRateLimiting.PolicyName)]
    [ProducesResponseType<CleanupReport>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CleanupReport>> Run(
        [FromHeader(Name = SecretHeader)] string? secret, CancellationToken cancellationToken)
    {
        if (!Matches(options.CurrentValue.Secret, secret))
        {
            LogRefused();
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "The clean-up needs its secret.");
        }

        return Ok(await cleanup.RunAsync(cancellationToken));
    }

    /// <summary>
    /// Whether the header carries the configured secret, compared in constant time. Without a configured secret nothing
    /// matches: the clean-up is off.
    /// </summary>
    public static bool Matches(string? expected, string? given) =>
        !string.IsNullOrWhiteSpace(expected)
        && given is not null
        && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(given));

    [LoggerMessage(Level = LogLevel.Warning, Message = "Clean-up refused: the secret is missing or wrong")]
    private partial void LogRefused();
}
