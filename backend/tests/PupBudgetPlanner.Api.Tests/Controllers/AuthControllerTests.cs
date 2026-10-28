using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class AuthControllerTests
{
    private static readonly CurrentUser Olena = new(Guid.CreateVersion7(), "Olena", "olena@example.com");

    private readonly IAuthService auth = Substitute.For<IAuthService>();
    private readonly IAntiforgery antiforgery = Substitute.For<IAntiforgery>();
    private readonly AuthController controller;

    public AuthControllerTests()
    {
        antiforgery.GetAndStoreTokens(Arg.Any<HttpContext>())
            .Returns(new AntiforgeryTokenSet("request-token", "cookie-token", "form", AntiforgeryToken.HeaderName));

        // Problem() needs a ProblemDetailsFactory from the request's services
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        controller = new AuthController(auth, antiforgery)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() },
            },
        };
    }

    private static int? StatusOf<T>(ActionResult<T> result) => result.Result switch
    {
        ObjectResult objectResult => objectResult.StatusCode,
        StatusCodeResult statusResult => statusResult.StatusCode,
        _ => null,
    };

    [Fact]
    public async Task Me_returns_the_signed_in_person_and_issues_a_readable_antiforgery_cookie()
    {
        auth.GetCurrentUserAsync(Arg.Any<ClaimsPrincipal>(), Arg.Any<CancellationToken>()).Returns(Olena);

        var result = await controller.Me(CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(Olena);
        var cookie = controller.Response.Headers.SetCookie.ToString();
        cookie.Should().Contain($"{AntiforgeryToken.CookieName}=request-token").And.Contain("samesite=strict");
        cookie.Should().NotContain("httponly");
    }

    [Fact]
    public async Task Me_answers_no_content_when_nobody_is_signed_in()
    {
        auth.GetCurrentUserAsync(Arg.Any<ClaimsPrincipal>(), Arg.Any<CancellationToken>()).Returns((CurrentUser?)null);

        var result = await controller.Me(CancellationToken.None);

        result.Result.Should().BeOfType<NoContentResult>();
        controller.Response.Headers.SetCookie.ToString().Should().Contain(AntiforgeryToken.CookieName);
    }

    [Fact]
    public async Task Register_returns_the_new_person()
    {
        auth.RegisterAsync(Arg.Any<RegisterRequest>(), Arg.Any<CancellationToken>())
            .Returns(new RegisterResult(RegisterOutcome.Registered, Olena));

        var result = await controller.Register(new RegisterRequest("Olena", "olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(Olena);
    }

    [Fact]
    public async Task Register_with_an_unavailable_email_answers_409_without_saying_the_account_exists()
    {
        auth.RegisterAsync(Arg.Any<RegisterRequest>(), Arg.Any<CancellationToken>())
            .Returns(new RegisterResult(RegisterOutcome.EmailUnavailable));

        var result = await controller.Register(new RegisterRequest("Olena", "olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        StatusOf(result).Should().Be(StatusCodes.Status409Conflict);
        var problem = result.Result.Should().BeOfType<ObjectResult>().Which.Value.Should().BeOfType<ProblemDetails>().Subject;
        problem.Title.Should().Be("We couldn't create an account with this email.");
        problem.Title.Should().NotContainAny("exists", "already");
    }

    [Theory]
    [InlineData(SignInOutcome.InvalidCredentials, StatusCodes.Status401Unauthorized)]
    [InlineData(SignInOutcome.LockedOut, StatusCodes.Status429TooManyRequests)]
    public async Task Login_failures_map_to_status_codes(SignInOutcome outcome, int status)
    {
        auth.SignInAsync(Arg.Any<SignInRequest>(), Arg.Any<CancellationToken>()).Returns(new SignInAttempt(outcome));

        var result = await controller.Login(new SignInRequest("olena@example.com", "x"), CancellationToken.None);

        StatusOf(result).Should().Be(status);
    }

    [Fact]
    public async Task Login_returns_the_signed_in_person()
    {
        auth.SignInAsync(Arg.Any<SignInRequest>(), Arg.Any<CancellationToken>())
            .Returns(new SignInAttempt(SignInOutcome.SignedIn, Olena));

        var result = await controller.Login(new SignInRequest("olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(Olena);
    }

    [Fact]
    public async Task Logout_signs_out()
    {
        var result = await controller.Logout(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        await auth.Received(1).SignOutAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public void Auth_endpoints_are_open_without_signing_in()
    {
        typeof(AuthController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).Should().ContainSingle();
    }

    [Theory]
    [InlineData(nameof(AuthController.Register))]
    [InlineData(nameof(AuthController.Login))]
    public void Register_and_login_are_rate_limited(string action)
    {
        var attribute = typeof(AuthController).GetMethod(action)!
            .GetCustomAttributes(typeof(EnableRateLimitingAttribute), inherit: false)
            .Should().ContainSingle().Which.Should().BeOfType<EnableRateLimitingAttribute>().Subject;

        attribute.PolicyName.Should().Be(AuthRateLimiting.PolicyName);
    }
}
