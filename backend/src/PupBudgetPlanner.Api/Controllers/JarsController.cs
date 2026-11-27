using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Jars;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The signed-in person's saving jars (F-034): goals that set money aside inside their accounts. Personal: no
/// <c>who</c>. The page checks the amounts first and says it in its own words; these texts are for anyone else calling
/// the API.
/// </summary>
[ApiController]
[Route("api/jars")]
public sealed class JarsController(IJarService jars) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The open jars, oldest first, with what is in each, where it lies and its history.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<JarItem>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<JarItem>>> List(CancellationToken cancellationToken) =>
        Ok(await jars.ListAsync(UserId, cancellationToken));

    [HttpPost]
    [ProducesResponseType<JarItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JarItem>> Create(SaveJarRequest request, CancellationToken cancellationToken) =>
        ItemOf(await jars.CreateAsync(UserId, request, cancellationToken));

    /// <summary>Its currency stays once money has gone in.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType<JarItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<JarItem>> Update(
        Guid id, SaveJarRequest request, CancellationToken cancellationToken) =>
        ItemOf(await jars.UpdateAsync(UserId, id, request, cancellationToken));

    /// <summary>Closes it: it leaves the list, its history stays and its money is free again.</summary>
    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken) =>
        Changed(await jars.CloseAsync(UserId, id, cancellationToken));

    /// <summary>
    /// Money into the jar from an account (in the account's currency, converted at today's NBU rate), out of it back to
    /// an account, or to another jar of the same currency (both in the jar's currency). The account's balance doesn't
    /// change. Answers the jar as it is now.
    /// </summary>
    [HttpPost("{id:guid}/moves")]
    [ProducesResponseType<JarItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<JarItem>> Move(
        Guid id, JarMoveRequest request, CancellationToken cancellationToken) =>
        ItemOf(await jars.MoveAsync(UserId, id, request, cancellationToken));

    /// <summary>
    /// A month's saved money (left of its budgets, or income minus expenses) split across jars in the month's currency,
    /// each part from an account; what isn't given out stays free.
    /// </summary>
    [HttpPost("saved-money")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SavedMoney(SavedMoneyRequest request, CancellationToken cancellationToken) =>
        Changed(await jars.PutSavedMoneyAsync(UserId, request, cancellationToken));

    private ActionResult<JarItem> ItemOf(JarResult result) =>
        result.Outcome == JarOutcome.Done ? Ok(result.Jar) : Refusal(result.Outcome);

    private IActionResult Changed(JarResult result) =>
        result.Outcome == JarOutcome.Done ? NoContent() : Refusal(result.Outcome);

    private ActionResult Refusal(JarOutcome outcome)
    {
        switch (outcome)
        {
            case JarOutcome.Closed:
                return Problem(statusCode: StatusCodes.Status409Conflict, title: "This jar is closed.");
            case JarOutcome.NoRate:
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "There is no NBU rate for these currencies today. Try again later.");
            case JarOutcome.CurrencyFixed:
                return Invalid("currency", "A jar with money in it keeps its currency.");
            case JarOutcome.NotEnough:
                return Invalid("amount", "The jar doesn't have that much on this account.");
            case JarOutcome.OtherJar:
                return Invalid("toJarId", "Pick another open jar in the same currency.");
            case JarOutcome.TooMuch:
                return Invalid("parts", "Together the jars get more than the month's saved money.");
            case JarOutcome.WrongCurrency:
                return Invalid("parts", "The saved money goes into jars and from accounts in the month's currency.");
            default:
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "There is no such jar or account.");
        }
    }

    private ActionResult Invalid(string field, string message)
    {
        ModelState.AddModelError(field, message);
        return ValidationProblem(ModelState);
    }
}
