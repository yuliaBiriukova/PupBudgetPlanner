using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Reports;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The signed-in person's yearly and monthly reports (F-021), like the spreadsheet, in the report currency or the one
/// asked for.
/// </summary>
[ApiController]
[Route("api/reports")]
public sealed class ReportsController(
    IReportService reports,
    IValidator<YearReportQuery> yearValidator,
    IValidator<MonthReportQuery> monthValidator) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>January to December of <paramref name="year"/>: the months still to come have no numbers.</summary>
    [HttpGet("year")]
    [ProducesResponseType<Report>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Report>> Year(
        [FromQuery] int year, CancellationToken cancellationToken, [FromQuery] string? currency = null)
    {
        var query = new YearReportQuery(year, currency);
        Check(yearValidator.Validate(query));

        return ModelState.IsValid
            ? Ok(await reports.ReportAsync(UserId, ReportPeriod.Year(year), currency, cancellationToken))
            : ValidationProblem(ModelState);
    }

    /// <summary>One month, <paramref name="month"/> written <c>yyyy-MM</c>; no Avg.</summary>
    [HttpGet("month")]
    [ProducesResponseType<Report>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Report>> Month(
        [FromQuery] string? month, CancellationToken cancellationToken, [FromQuery] string? currency = null)
    {
        var query = new MonthReportQuery(month, currency);
        Check(monthValidator.Validate(query));
        if (!ModelState.IsValid || query.First is not { } first)
        {
            return ValidationProblem(ModelState);
        }

        return Ok(await reports.ReportAsync(
            UserId, ReportPeriod.Month(first.Year, first.Month), currency, cancellationToken));
    }

    /// <summary>The query comes as separate values (camelCase, like the JSON), so its validator runs here.</summary>
    private void Check(ValidationResult result)
    {
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(JsonNamingPolicy.CamelCase.ConvertName(error.PropertyName), error.ErrorMessage);
        }
    }
}
