using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Validation;
using PupBudgetPlanner.Application;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Tests.Auth;

public sealed class AntiforgeryFilterTests
{
    private readonly IAntiforgery antiforgery = Substitute.For<IAntiforgery>();

    private static AuthorizationFilterContext ContextFor(string method) =>
        new(
            new ActionContext(new DefaultHttpContext { Request = { Method = method } }, new RouteData(), new ActionDescriptor()),
            []);

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task Rejects_a_change_without_a_valid_token(string method)
    {
        antiforgery.IsRequestValidAsync(Arg.Any<HttpContext>()).Returns(false);
        var context = ContextFor(method);

        await new AntiforgeryFilter(antiforgery).OnAuthorizationAsync(context);

        context.Result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Lets_a_change_with_a_valid_token_through()
    {
        antiforgery.IsRequestValidAsync(Arg.Any<HttpContext>()).Returns(true);
        var context = ContextFor("POST");

        await new AntiforgeryFilter(antiforgery).OnAuthorizationAsync(context);

        context.Result.Should().BeNull();
    }

    [Fact]
    public async Task Does_not_check_reads()
    {
        var context = ContextFor("GET");

        await new AntiforgeryFilter(antiforgery).OnAuthorizationAsync(context);

        context.Result.Should().BeNull();
        await antiforgery.DidNotReceive().IsRequestValidAsync(Arg.Any<HttpContext>());
    }

    [Fact]
    public async Task Skips_an_endpoint_that_opts_out_and_checks_one_that_asks_for_it()
    {
        antiforgery.IsRequestValidAsync(Arg.Any<HttpContext>()).Returns(false);
        var optedOut = ContextFor("POST");
        optedOut.ActionDescriptor.EndpointMetadata = [new RequireAntiforgeryTokenAttribute(required: false)];
        var required = ContextFor("POST");
        required.ActionDescriptor.EndpointMetadata = [new RequireAntiforgeryTokenAttribute()];

        await new AntiforgeryFilter(antiforgery).OnAuthorizationAsync(optedOut);
        await new AntiforgeryFilter(antiforgery).OnAuthorizationAsync(required);

        optedOut.Result.Should().BeNull();
        required.Result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }
}

public sealed class ValidationFilterTests
{
    private readonly IServiceProvider services = new ServiceCollection().AddApplication().BuildServiceProvider();

    private static ActionExecutingContext ContextWith(object argument)
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var http = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
        var controller = new TestController
        {
            ControllerContext = new ControllerContext(new ActionContext(http, new RouteData(), new ControllerActionDescriptor())),
        };
        return new ActionExecutingContext(
            new ActionContext(http, new RouteData(), new ActionDescriptor(), controller.ModelState),
            [],
            new Dictionary<string, object?> { ["request"] = argument },
            controller);
    }

    [Fact]
    public async Task Answers_400_with_camel_case_field_errors_and_skips_the_action()
    {
        var context = ContextWith(new RegisterRequest("", "olena", "123"));
        var actionRan = false;

        await new ValidationFilter(services).OnActionExecutionAsync(context, () =>
        {
            actionRan = true;
            return Task.FromResult<ActionExecutedContext>(null!);
        });

        actionRan.Should().BeFalse();
        var problem = context.Result.Should().BeAssignableTo<ObjectResult>().Which.Value
            .Should().BeOfType<ValidationProblemDetails>().Subject;
        problem.Errors.Keys.Should().BeEquivalentTo("displayName", "email", "password");
    }

    [Fact]
    public async Task Runs_the_action_for_valid_input()
    {
        var context = ContextWith(new SignInRequest("olena@example.com", "kyiv-budget-26"));
        var actionRan = false;

        await new ValidationFilter(services).OnActionExecutionAsync(context, () =>
        {
            actionRan = true;
            return Task.FromResult<ActionExecutedContext>(null!);
        });

        actionRan.Should().BeTrue();
        context.Result.Should().BeNull();
    }

    [Fact]
    public void Every_request_record_has_a_validator()
    {
        services.GetService<IValidator<RegisterRequest>>().Should().NotBeNull();
        services.GetService<IValidator<SignInRequest>>().Should().NotBeNull();
    }

    private sealed class TestController : ControllerBase;
}
