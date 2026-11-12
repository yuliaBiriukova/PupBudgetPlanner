using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Families;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// What the other members of the family see of the signed-in person's money (F-030), set on the Family page. Each
/// person sets their own; a change counts at once and deletes or moves nothing. The family views read it through
/// <c>who</c> (<see cref="WhoseMoney"/>); the person's own accounts and categories say what is set
/// (<c>familySees</c>, <c>isPrivate</c>), and the family's members what each shares.
/// </summary>
[ApiController]
[Route("api/family/privacy")]
public sealed class FamilyPrivacyController(IFamilyPrivacyService privacy) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>All your transactions, or only their totals by category.</summary>
    [HttpPut("transactions")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ShareTransactions(
        ShareTransactionsRequest request, CancellationToken cancellationToken)
    {
        await privacy.ShareTransactionsAsync(UserId, request.Share, cancellationToken);
        return NoContent();
    }

    /// <summary>Everything, its balance only, or nothing of one of your accounts.</summary>
    [HttpPut("accounts/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ShareAccount(
        Guid id, ShareAccountRequest request, CancellationToken cancellationToken) =>
        await privacy.ShareAccountAsync(UserId, id, request.Share, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "You have no such account.");

    /// <summary>Keeps one of your categories from the family, or shares it again.</summary>
    [HttpPut("categories/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> KeepCategory(
        Guid id, KeepCategoryRequest request, CancellationToken cancellationToken) =>
        await privacy.KeepCategoryAsync(UserId, id, request.IsPrivate, cancellationToken)
            ? NoContent()
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "You have no such category.");
}
