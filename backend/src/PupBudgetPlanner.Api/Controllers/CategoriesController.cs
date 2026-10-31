using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Categories;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>The signed-in person's category groups and categories (F-015), read-only.</summary>
[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ICategoryService categories) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The groups in the report's order, each with the categories in use.</summary>
    [HttpGet]
    [ProducesResponseType<CategoriesOverview>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CategoriesOverview>> Overview(CancellationToken cancellationToken) =>
        Ok(await categories.OverviewAsync(UserId, cancellationToken));
}
