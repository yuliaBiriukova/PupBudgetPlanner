using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class CategoriesControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly Guid Id = Guid.CreateVersion7();
    private static readonly Guid GroupId = Guid.CreateVersion7();

    private static readonly AddCategoryRequest Add = new(GroupId, "Pets", null);
    private static readonly UpdateCategoryRequest Update = new("Pets", GroupId, 0);
    private static readonly AddGroupRequest AddGroupBody = new(CategoryKind.Expense, "Car", null);
    private static readonly UpdateGroupRequest UpdateGroupBody = new("Car", 1);

    private readonly ICategoryService categories = Substitute.For<ICategoryService>();
    private readonly CategoriesController controller;

    public CategoriesControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var person = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new CategoriesController(categories)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider(), User = person },
            },
        };
    }

    private static int? Status(IActionResult result) => ((IStatusCodeActionResult)result).StatusCode;

    private static int? Status<T>(ActionResult<T> result) => ((IStatusCodeActionResult)result.Result!).StatusCode;

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(CategoriesController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task Overview_returns_the_signed_in_persons_categories()
    {
        var salary = new CategoryItem(Guid.CreateVersion7(), "Salary", false, 3);
        var overview = new CategoriesOverview(
            [new CategoryGroupItem(Guid.CreateVersion7(), "Income", CategoryKind.Income, false, [salary])]);
        categories.OverviewAsync(UserId, Arg.Any<CancellationToken>()).Returns(overview);

        (await controller.Overview(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(overview);
    }

    [Fact]
    public async Task Changes_go_through_for_the_signed_in_person()
    {
        var done = new CategoryResult(CategoryOutcome.Done, Id);
        categories.AddCategoryAsync(UserId, Add, Arg.Any<CancellationToken>()).Returns(done);
        categories.UpdateCategoryAsync(UserId, Id, Update, Arg.Any<CancellationToken>()).Returns(done);
        categories.RestoreCategoryAsync(UserId, Id, Arg.Any<CancellationToken>()).Returns(done);
        categories.AddGroupAsync(UserId, AddGroupBody, Arg.Any<CancellationToken>()).Returns(done);
        categories.UpdateGroupAsync(UserId, Id, UpdateGroupBody, Arg.Any<CancellationToken>()).Returns(done);
        categories.RestoreGroupAsync(UserId, Id, Arg.Any<CancellationToken>()).Returns(done);

        (await controller.AddCategory(Add, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new AddedItem(Id));
        (await controller.UpdateCategory(Id, Update, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        (await controller.RestoreCategory(Id, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        (await controller.AddGroup(AddGroupBody, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new AddedItem(Id));
        (await controller.UpdateGroup(Id, UpdateGroupBody, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        (await controller.RestoreGroup(Id, CancellationToken.None)).Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Removing_says_whether_it_was_deleted_or_hidden()
    {
        categories.RemoveCategoryAsync(UserId, Id, Arg.Any<CancellationToken>())
            .Returns(new CategoryResult(CategoryOutcome.Done, Id, Removal.Hidden));
        categories.RemoveGroupAsync(UserId, Id, Arg.Any<CancellationToken>())
            .Returns(new CategoryResult(CategoryOutcome.Done, Id, Removal.Deleted));

        (await controller.RemoveCategory(Id, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new RemovedItem(Removal.Hidden));
        (await controller.RemoveGroup(Id, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new RemovedItem(Removal.Deleted));
    }

    [Fact]
    public async Task Someone_elses_or_a_made_up_id_is_not_found()
    {
        var notFound = new CategoryResult(CategoryOutcome.NotFound);
        categories.UpdateCategoryAsync(UserId, Id, Update, Arg.Any<CancellationToken>()).Returns(notFound);
        categories.RemoveCategoryAsync(UserId, Id, Arg.Any<CancellationToken>()).Returns(notFound);
        categories.RemoveGroupAsync(UserId, Id, Arg.Any<CancellationToken>()).Returns(notFound);

        Status(await controller.UpdateCategory(Id, Update, CancellationToken.None)).Should().Be(404);
        Status(await controller.RemoveCategory(Id, CancellationToken.None)).Should().Be(404);
        Status(await controller.RemoveGroup(Id, CancellationToken.None)).Should().Be(404);
    }

    [Theory]
    [InlineData(CategoryOutcome.NameTaken, "name")]
    [InlineData(CategoryOutcome.NameTakenByHidden, "name")]
    [InlineData(CategoryOutcome.OtherKind, "groupId")]
    public async Task A_name_in_use_or_a_group_of_the_other_kind_is_a_mistake_in_its_field(
        CategoryOutcome outcome, string field)
    {
        categories.AddCategoryAsync(UserId, Add, Arg.Any<CancellationToken>()).Returns(new CategoryResult(outcome));

        var result = (await controller.AddCategory(Add, CancellationToken.None)).Result;

        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey(field);
        Status(result!).Should().Be(400);
    }

    [Theory]
    [InlineData(CategoryOutcome.StillHasCategories)]
    [InlineData(CategoryOutcome.LastOfKind)]
    [InlineData(CategoryOutcome.Hidden)]
    public async Task A_group_that_cant_go_or_a_hidden_one_is_a_conflict(CategoryOutcome outcome)
    {
        categories.RemoveGroupAsync(UserId, Id, Arg.Any<CancellationToken>()).Returns(new CategoryResult(outcome));
        categories.UpdateGroupAsync(UserId, Id, UpdateGroupBody, Arg.Any<CancellationToken>())
            .Returns(new CategoryResult(outcome));

        Status(await controller.RemoveGroup(Id, CancellationToken.None)).Should().Be(409);
        Status(await controller.UpdateGroup(Id, UpdateGroupBody, CancellationToken.None)).Should().Be(409);
    }
}
