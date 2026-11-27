using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Jars;
using PupBudgetPlanner.Domain.Jars;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class JarsControllerTests
{
    private static readonly Guid Person = Guid.CreateVersion7();
    private static readonly Guid JarId = Guid.CreateVersion7();
    private static readonly Guid Account = Guid.CreateVersion7();

    private static readonly JarItem Car = new(
        JarId, "Car", JarIcon.Car, JarColor.Blue, "UAH", 400_000, "2027-12", null, 5_000, [], [], null, 5_000, null);

    private static readonly SaveJarRequest Request = new("Car", JarIcon.Car, JarColor.Blue, "UAH", 400_000, "2027-12", null);

    private readonly IJarService jars = Substitute.For<IJarService>();
    private readonly JarsController controller;

    public JarsControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        controller = new JarsController(jars)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    RequestServices = services.BuildServiceProvider(),
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, Person.ToString())], "Test")),
                },
            },
        };
    }

    [Fact]
    public async Task The_jars_listed_are_the_signed_in_persons()
    {
        jars.ListAsync(Person, Arg.Any<CancellationToken>()).Returns([Car]);

        var result = await controller.List(CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeEquivalentTo(new[] { Car });
    }

    [Fact]
    public async Task A_new_jar_is_answered_as_saved()
    {
        jars.CreateAsync(Person, Request, Arg.Any<CancellationToken>()).Returns(new JarResult(JarOutcome.Done, Car));

        var result = await controller.Create(Request, CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(Car);
    }

    [Fact]
    public async Task A_new_currency_for_a_jar_with_money_is_a_mistake_in_the_currency()
    {
        jars.UpdateAsync(Person, JarId, Request, Arg.Any<CancellationToken>())
            .Returns(new JarResult(JarOutcome.CurrencyFixed));

        var result = await controller.Update(JarId, Request, CancellationToken.None);

        result.Result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("currency");
    }

    [Fact]
    public async Task Taking_out_more_than_lies_on_the_account_is_a_mistake_in_the_amount()
    {
        var request = new JarMoveRequest(JarMoveAction.Out, Account, 9_000, null);
        jars.MoveAsync(Person, JarId, request, Arg.Any<CancellationToken>()).Returns(new JarResult(JarOutcome.NotEnough));

        var result = await controller.Move(JarId, request, CancellationToken.None);

        result.Result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("amount");
    }

    [Theory]
    [InlineData(JarOutcome.Closed, StatusCodes.Status409Conflict)]
    [InlineData(JarOutcome.NoRate, StatusCodes.Status409Conflict)]
    [InlineData(JarOutcome.NotFound, StatusCodes.Status404NotFound)]
    public async Task A_closed_jar_a_missing_rate_and_a_jar_not_found_are_said_so(JarOutcome outcome, int status)
    {
        var request = new JarMoveRequest(JarMoveAction.In, Account, 100, null);
        jars.MoveAsync(Person, JarId, request, Arg.Any<CancellationToken>()).Returns(new JarResult(outcome));

        var result = await controller.Move(JarId, request, CancellationToken.None);

        result.Result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(status);
    }

    [Fact]
    public async Task Closing_a_jar_answers_nothing()
    {
        jars.CloseAsync(Person, JarId, Arg.Any<CancellationToken>()).Returns(JarResult.Done);

        (await controller.Close(JarId, CancellationToken.None)).Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Splitting_more_than_was_saved_is_a_mistake_in_the_parts()
    {
        var request = new SavedMoneyRequest("2026-11", SavedMoneyWay.LeftOfBudgets, [new(JarId, Account, 90_000)]);
        jars.PutSavedMoneyAsync(Person, request, Arg.Any<CancellationToken>()).Returns(new JarResult(JarOutcome.TooMuch));

        var result = await controller.SavedMoney(request, CancellationToken.None);

        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("parts");
    }
}
