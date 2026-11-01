using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Settings;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The signed-in person's name and report currency (F-016). The theme is kept on each device.</summary>
[ApiController]
[Route("api/settings")]
public sealed class SettingsController(ISettingsService settings) : ControllerBase
{
    private const string NoAccount = "There is no such account.";

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ProducesResponseType<UserSettings>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserSettings>> Get(CancellationToken cancellationToken) =>
        Found(await settings.GetAsync(UserId, cancellationToken));

    [HttpPut("name")]
    [ProducesResponseType<UserSettings>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserSettings>> ChangeName(
        ChangeNameRequest request, CancellationToken cancellationToken) =>
        Found(await settings.ChangeNameAsync(UserId, request, cancellationToken));

    /// <summary>The currency "In total" on Accounts (and the reports later) is shown in.</summary>
    [HttpPut("report-currency")]
    [ProducesResponseType<UserSettings>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserSettings>> ChangeReportCurrency(
        ChangeReportCurrencyRequest request, CancellationToken cancellationToken) =>
        Found(await settings.ChangeReportCurrencyAsync(UserId, request, cancellationToken));

    /// <summary>A cookie that outlived its account (deleted in the meantime) gets 404, like any missing thing.</summary>
    private ActionResult<UserSettings> Found(UserSettings? result) =>
        result is null ? Problem(statusCode: StatusCodes.Status404NotFound, title: NoAccount) : Ok(result);
}
