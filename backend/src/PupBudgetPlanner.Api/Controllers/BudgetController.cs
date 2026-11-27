using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Domain.Budgets;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The signed-in person's monthly budget (F-033): a month's total, group and category budgets with what was spent, and
/// their changes. Personal: no <c>who</c>. The page checks the amounts first and says it in its own words; these texts
/// are for anyone else calling the API.
/// </summary>
[ApiController]
[Route("api/budget")]
public sealed class BudgetController(IBudgetService budgets, IValidator<BudgetMonthQuery> monthValidator)
    : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary><paramref name="month"/> written <c>yyyy-MM</c>, from 2000 to next month.</summary>
    [HttpGet]
    [ProducesResponseType<MonthBudget>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MonthBudget>> Month([FromQuery] string? month, CancellationToken cancellationToken)
    {
        if (!ValidQuery(month))
        {
            return ValidationProblem(ModelState);
        }

        return Ok(await budgets.MonthAsync(UserId, BudgetMonths.Parse(month)!.Value, cancellationToken));
    }

    /// <summary>
    /// Deletes the plan of <paramref name="month"/> (<c>yyyy-MM</c>): its total and every group and category budget.
    /// The month is then not planned, as if never started; transactions stay.
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromQuery] string? month, CancellationToken cancellationToken)
    {
        if (!ValidQuery(month))
        {
            return ValidationProblem(ModelState);
        }

        return Changed(await budgets.DeleteAsync(UserId, BudgetMonths.Parse(month)!.Value, cancellationToken));
    }

    private bool ValidQuery(string? month)
    {
        foreach (var error in monthValidator.Validate(new BudgetMonthQuery(month)).Errors)
        {
            ModelState.AddModelError(JsonNamingPolicy.CamelCase.ConvertName(error.PropertyName), error.ErrorMessage);
        }

        return ModelState.IsValid;
    }

    /// <summary>Plans a month not planned yet: a copy of the last planned one, or empty.</summary>
    [HttpPost("start")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Start(StartMonthRequest request, CancellationToken cancellationToken) =>
        Changed(await budgets.StartAsync(UserId, MonthOf(request.Month), request.CopyLast, cancellationToken));

    /// <summary>The month's total; no amount removes it. Refused when the groups would take more.</summary>
    [HttpPut("total")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetTotal(SetBudgetRequest request, CancellationToken cancellationToken) =>
        Changed(await budgets.SetTotalAsync(UserId, MonthOf(request.Month), request.Amount, cancellationToken));

    /// <summary>An expense group's own budget; refused when its categories or the total don't fit.</summary>
    [HttpPut("groups/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetGroup(Guid id, SetBudgetRequest request, CancellationToken cancellationToken) =>
        Changed(await budgets.SetGroupAsync(UserId, MonthOf(request.Month), id, request.Amount, cancellationToken));

    /// <summary>An expense category's budget; refused when its group or the total doesn't hold it.</summary>
    [HttpPut("categories/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetCategory(
        Guid id, SetBudgetRequest request, CancellationToken cancellationToken) =>
        Changed(await budgets.SetCategoryAsync(UserId, MonthOf(request.Month), id, request.Amount, cancellationToken));

    /// <summary>
    /// What the month plans to set aside into an open jar in its currency (F-034); no amount takes it out of the plan.
    /// Refused when the groups and jars would take more than the total.
    /// </summary>
    [HttpPut("jars/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetJar(Guid id, SetBudgetRequest request, CancellationToken cancellationToken) =>
        Changed(await budgets.SetJarAsync(UserId, MonthOf(request.Month), id, request.Amount, cancellationToken));

    /// <summary>The validators have checked the month already.</summary>
    private static DateOnly MonthOf(string month) => BudgetMonths.Parse(month)!.Value;

    private IActionResult Changed(BudgetResult result)
    {
        switch (result.Outcome)
        {
            case BudgetOutcome.Done:
                return NoContent();
            case BudgetOutcome.AlreadyPlanned:
                return Problem(statusCode: StatusCodes.Status409Conflict, title: "This month is planned already.");
            case BudgetOutcome.NotPlanned:
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "This month isn't planned.");
            case BudgetOutcome.Overflow:
                ModelState.AddModelError("amount", OverflowText(result.Overflow!));
                return ValidationProblem(ModelState);
            default:
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "There is no such expense group, category or jar.");
        }
    }

    /// <summary>What goes over and by how much (F-033).</summary>
    public static string OverflowText(BudgetOverflow overflow)
    {
        string Amount(decimal value) => value.ToString("#,0", CultureInfo.InvariantCulture);
        return overflow.IsTotal
            ? overflow.Jars > 0
                ? $"The groups and jars add up to {Amount(overflow.Inside)}, {Amount(overflow.Over)} more than the month's total of {Amount(overflow.Budget)}."
                : $"The groups add up to {Amount(overflow.Inside)}, {Amount(overflow.Over)} more than the month's total of {Amount(overflow.Budget)}."
            : $"Its categories add up to {Amount(overflow.Inside)}, {Amount(overflow.Over)} more than the group's {Amount(overflow.Budget)}.";
    }
}
