using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// The signed-in person's category groups and categories: the whole set (F-015) and its changes (F-029). The page checks
/// names first and says it in its own words; these texts are for anyone else calling the API.
/// </summary>
[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ICategoryService categories) : ControllerBase
{
    private const string NoSuchCategory = "There is no such category.";
    private const string NoSuchGroup = "There is no such group.";

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The groups in the report's order, each with its shown categories, then its hidden ones.</summary>
    [HttpGet]
    [ProducesResponseType<CategoriesOverview>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CategoriesOverview>> Overview(CancellationToken cancellationToken) =>
        Ok(await categories.OverviewAsync(UserId, cancellationToken));

    [HttpPost]
    [ProducesResponseType<AddedItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AddedItem>> AddCategory(
        AddCategoryRequest request, CancellationToken cancellationToken) =>
        Added(await categories.AddCategoryAsync(UserId, request, cancellationToken), NoSuchGroup);

    /// <summary>Renames it and puts it at a place in its group or another group of its kind.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateCategory(
        Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken) =>
        Changed(await categories.UpdateCategoryAsync(UserId, id, request, cancellationToken), NoSuchCategory);

    /// <summary>Deletes it when no transaction has it, otherwise hides it: its transactions and the reports keep it.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType<RemovedItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RemovedItem>> RemoveCategory(Guid id, CancellationToken cancellationToken) =>
        Removed(await categories.RemoveCategoryAsync(UserId, id, cancellationToken), NoSuchCategory);

    /// <summary>Shows a hidden category again at the end of its group (and its group, when that was hidden).</summary>
    [HttpPost("{id:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreCategory(Guid id, CancellationToken cancellationToken) =>
        Changed(await categories.RestoreCategoryAsync(UserId, id, cancellationToken), NoSuchCategory);

    [HttpPost("groups")]
    [ProducesResponseType<AddedItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AddedItem>> AddGroup(AddGroupRequest request, CancellationToken cancellationToken) =>
        Added(await categories.AddGroupAsync(UserId, request, cancellationToken), NoSuchGroup);

    /// <summary>Renames it and puts it at a place among the groups of its kind.</summary>
    [HttpPut("groups/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateGroup(
        Guid id, UpdateGroupRequest request, CancellationToken cancellationToken) =>
        Changed(await categories.UpdateGroupAsync(UserId, id, request, cancellationToken), NoSuchGroup);

    /// <summary>
    /// Deletes it when empty, hides it when it holds only hidden categories; a group with shown categories, or the only
    /// one of its kind, stays (409).
    /// </summary>
    [HttpDelete("groups/{id:guid}")]
    [ProducesResponseType<RemovedItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RemovedItem>> RemoveGroup(Guid id, CancellationToken cancellationToken) =>
        Removed(await categories.RemoveGroupAsync(UserId, id, cancellationToken), NoSuchGroup);

    [HttpPost("groups/{id:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreGroup(Guid id, CancellationToken cancellationToken) =>
        Changed(await categories.RestoreGroupAsync(UserId, id, cancellationToken), NoSuchGroup);

    private ActionResult<AddedItem> Added(CategoryResult result, string notFound) =>
        result.Outcome == CategoryOutcome.Done ? Ok(new AddedItem(result.Id!.Value)) : ProblemOf(result, notFound);

    private IActionResult Changed(CategoryResult result, string notFound) =>
        result.Outcome == CategoryOutcome.Done ? NoContent() : ProblemOf(result, notFound);

    private ActionResult<RemovedItem> Removed(CategoryResult result, string notFound) =>
        result.Outcome == CategoryOutcome.Done ? Ok(new RemovedItem(result.Removal!.Value)) : ProblemOf(result, notFound);

    /// <summary>A name in use or a group of the other kind is a mistake in a field, a 400 like the validators'.</summary>
    private ActionResult ProblemOf(CategoryResult result, string notFound)
    {
        switch (result.Outcome)
        {
            case CategoryOutcome.NameTaken:
                return FieldProblem(nameof(UpdateCategoryRequest.Name), "This name is already in use there.");
            case CategoryOutcome.NameTakenByHidden:
                return FieldProblem(
                    nameof(UpdateCategoryRequest.Name),
                    "A hidden category in this group has this name. Show it again instead.");
            case CategoryOutcome.OtherKind:
                return FieldProblem(
                    nameof(UpdateCategoryRequest.GroupId), "Pick a group of the same kind (income or expenses).");
            case CategoryOutcome.Hidden:
                return Problem(statusCode: StatusCodes.Status409Conflict, title: "It's hidden. Show it again first.");
            case CategoryOutcome.StillHasCategories:
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "It still has categories. Move them to another group or remove them first.");
            case CategoryOutcome.LastOfKind:
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "It's your only group of its kind, so it stays. Add another one first.");
            default:
                return Problem(statusCode: StatusCodes.Status404NotFound, title: notFound);
        }
    }

    private ActionResult FieldProblem(string field, string message)
    {
        ModelState.AddModelError(JsonNamingPolicy.CamelCase.ConvertName(field), message);
        return ValidationProblem(ModelState);
    }
}
