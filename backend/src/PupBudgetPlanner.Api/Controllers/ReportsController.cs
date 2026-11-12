using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Application.Reports;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The signed-in person's yearly and monthly reports (F-021), like the spreadsheet, in the report currency or the one
/// asked for; a family member's or the family's to look at (F-024), with <c>who</c> as on the other pages.
/// </summary>
[ApiController]
[Route("api/reports")]
public sealed class ReportsController(
    IReportService reports,
    IValidator<YearReportQuery> yearValidator,
    IValidator<MonthReportQuery> monthValidator,
    IFamilyService families) : ControllerBase
{
    /// <summary>
    /// January to December of <paramref name="year"/>: the months still to come have no numbers.
    /// <paramref name="who"/>: <c>me</c> (the default), <c>family</c> or a family member's id (F-024).
    /// </summary>
    [HttpGet("year")]
    [ProducesResponseType<Report>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Report>> Year(
        [FromQuery] int year,
        CancellationToken cancellationToken,
        [FromQuery] string? currency = null,
        [FromQuery] string? who = null)
    {
        var query = new YearReportQuery(year, currency);
        Check(yearValidator.Validate(query));
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var (scope, refusal) = await this.ScopeOfAsync(families, who, cancellationToken);
        return scope is null
            ? refusal!
            : Ok(await reports.ReportAsync(scope, ReportPeriod.Year(year), currency, cancellationToken));
    }

    /// <summary>One month, <paramref name="month"/> written <c>yyyy-MM</c>; no Avg. Whose: as for the year.</summary>
    [HttpGet("month")]
    [ProducesResponseType<Report>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Report>> Month(
        [FromQuery] string? month,
        CancellationToken cancellationToken,
        [FromQuery] string? currency = null,
        [FromQuery] string? who = null)
    {
        var query = new MonthReportQuery(month, currency);
        Check(monthValidator.Validate(query));
        if (!ModelState.IsValid || query.First is not { } first)
        {
            return ValidationProblem(ModelState);
        }

        var (scope, refusal) = await this.ScopeOfAsync(families, who, cancellationToken);
        return scope is null
            ? refusal!
            : Ok(await reports.ReportAsync(
                scope, ReportPeriod.Month(first.Year, first.Month), currency, cancellationToken));
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
