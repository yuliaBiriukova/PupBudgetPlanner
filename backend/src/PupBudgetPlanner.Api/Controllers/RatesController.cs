using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using PupBudgetPlanner.Application.ExchangeRates;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The NBU's official rates (F-017), for the transfer form's suggested amount (F-019).</summary>
[ApiController]
[Route("api/rates")]
public sealed class RatesController(IExchangeRateService rates, TimeProvider clock) : ControllerBase
{
    /// <summary>
    /// The rates of <paramref name="date"/> (a transaction's day, never after today), or the latest earlier ones,
    /// marked with the reason.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<RatesOfDay>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RatesOfDay>> OfDay(
        [FromQuery, BindRequired] DateOnly date, CancellationToken cancellationToken)
    {
        // The NBU sets tomorrow's rates in the afternoon, but no transaction is after today (F-018)
        if (date > Kyiv.Today(clock))
        {
            ModelState.AddModelError(nameof(date), "Pick today or a day before it.");
            return ValidationProblem(ModelState);
        }

        return Ok(RatesOfDay.Of(await rates.RatesOnAsync(date, cancellationToken)));
    }
}
