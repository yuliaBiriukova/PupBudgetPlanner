using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class CategoriesControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();

    private readonly ICategoryService categories = Substitute.For<ICategoryService>();
    private readonly CategoriesController controller;

    public CategoriesControllerTests()
    {
        var person = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new CategoriesController(categories)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = person } },
        };
    }

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(CategoriesController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task Overview_returns_the_signed_in_persons_categories()
    {
        var salary = new CategoryItem(Guid.CreateVersion7(), "Salary");
        var overview = new CategoriesOverview(
            [new CategoryGroupItem(Guid.CreateVersion7(), "Income", CategoryKind.Income, [salary])]);
        categories.OverviewAsync(UserId, Arg.Any<CancellationToken>()).Returns(overview);

        (await controller.Overview(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(overview);
    }
}
