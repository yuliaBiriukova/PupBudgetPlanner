using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Families;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The <c>who</c> of the pages that show money (F-024): <c>me</c> (the default), <c>family</c>, or a family member's id.
/// Someone else's money is only to look at: the endpoints that change anything take the signed-in person alone.
/// </summary>
internal static class WhoseMoney
{
    public const string NoSuchPerson = "There is no such person in your family.";

    /// <summary>
    /// The money <paramref name="who"/> asks for, or the answer to give instead: a 400 for a <c>who</c> that is none of
    /// the three, a 404 when it isn't the signed-in person's to look at (no family, or someone not in it).
    /// </summary>
    public static async Task<(MoneyScope? Scope, ActionResult? Refusal)> ScopeOfAsync(
        this ControllerBase controller, IFamilyService families, string? who, CancellationToken cancellationToken)
    {
        if (!Who.TryParse(who, out var asked))
        {
            controller.ModelState.AddModelError(nameof(who), "Ask for me, family or someone in your family.");
            return (null, controller.ValidationProblem(controller.ModelState));
        }

        var userId = Guid.Parse(controller.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Your own needs no family
        var scope = asked.IsMe ? MoneyScope.Own(userId) : await families.ScopeAsync(userId, asked, cancellationToken);
        return scope is null
            ? (null, controller.Problem(statusCode: StatusCodes.Status404NotFound, title: NoSuchPerson))
            : (scope, null);
    }
}
