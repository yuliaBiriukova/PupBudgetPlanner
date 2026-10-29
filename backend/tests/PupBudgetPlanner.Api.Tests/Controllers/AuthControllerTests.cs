using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Identity;

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
        controller = new AuthController(auth, antiforgery, NullLogger<AuthController>.Instance)
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
    [InlineData(RegisterOutcome.InvitationRequired, StatusCodes.Status403Forbidden, AuthController.InviteOnlyTitle)]
    [InlineData(RegisterOutcome.InvitationInvalid, StatusCodes.Status410Gone, AuthController.InvitationGoneTitle)]
    public async Task Register_without_a_working_invite_link_says_why(RegisterOutcome outcome, int status, string title)
    {
        auth.RegisterAsync(Arg.Any<RegisterRequest>(), Arg.Any<CancellationToken>()).Returns(new RegisterResult(outcome));

        var result = await controller.Register(new RegisterRequest("Olena", "olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        StatusOf(result).Should().Be(status);
        result.Result.Should().BeOfType<ObjectResult>().Which.Value.Should().BeOfType<ProblemDetails>()
            .Which.Title.Should().Be(title);
    }

    [Theory]
    [InlineData(SignInOutcome.InvalidCredentials, StatusCodes.Status401Unauthorized)]
    [InlineData(SignInOutcome.LockedOut, StatusCodes.Status429TooManyRequests)]
    [InlineData(SignInOutcome.Blocked, StatusCodes.Status403Forbidden)]
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

    private static IAuthenticationSchemeProvider Schemes(bool googleConfigured)
    {
        var schemes = Substitute.For<IAuthenticationSchemeProvider>();
        schemes.GetSchemeAsync(GoogleSignIn.Scheme).Returns(googleConfigured
            ? new AuthenticationScheme(GoogleSignIn.Scheme, "Google", typeof(GoogleHandler))
            : null);
        return schemes;
    }

    [Fact]
    public async Task Continue_with_google_sends_the_person_to_google_and_back_to_the_page_they_wanted()
    {
        var result = await controller.Google("/reports?year=2026", null, Schemes(googleConfigured: true), CancellationToken.None);

        var challenge = result.Should().BeOfType<ChallengeResult>().Subject;
        challenge.AuthenticationSchemes.Should().Equal(GoogleSignIn.Scheme);
        challenge.Properties!.RedirectUri.Should().Be("/api/auth/google/complete?returnUrl=%2Freports%3Fyear%3D2026");
        challenge.Properties.Items.Should().Contain("LoginProvider", GoogleSignIn.Scheme);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("reports")]
    [InlineData("https://evil.example/")]
    [InlineData("//evil.example/")]
    [InlineData("/\\evil.example/")]
    public async Task Continue_with_google_only_returns_to_a_path_in_the_app(string? returnUrl)
    {
        var result = await controller.Google(returnUrl, null, Schemes(googleConfigured: true), CancellationToken.None);

        result.Should().BeOfType<ChallengeResult>()
            .Which.Properties!.RedirectUri.Should().Be("/api/auth/google/complete?returnUrl=%2F");
    }

    [Fact]
    public async Task Continue_with_google_from_the_invite_page_carries_the_token_through_google()
    {
        var result = await controller.Google("/", "the-token", Schemes(googleConfigured: true), CancellationToken.None);

        result.Should().BeOfType<ChallengeResult>()
            .Which.Properties!.Items.Should().Contain(ExternalClaims.InviteTokenItem, "the-token");
    }

    [Fact]
    public async Task Continue_with_google_ignores_a_token_that_is_far_too_long()
    {
        var result = await controller.Google("/", new string('a', 500), Schemes(googleConfigured: true), CancellationToken.None);

        result.Should().BeOfType<ChallengeResult>()
            .Which.Properties!.Items.Should().NotContainKey(ExternalClaims.InviteTokenItem);
    }

    [Fact]
    public async Task Continue_with_google_without_a_google_client_comes_back_with_the_error()
    {
        var result = await controller.Google("/reports", null, Schemes(googleConfigured: false), CancellationToken.None);

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be("/sign-in?error=google");
    }

    [Theory]
    [InlineData("/reports", "/reports")]
    [InlineData("//evil.example/", "/")]
    [InlineData(null, "/")]
    public async Task Google_complete_signs_in_and_opens_the_page_they_wanted(string? returnUrl, string expected)
    {
        auth.SignInWithExternalLoginAsync(Arg.Any<CancellationToken>()).Returns(ExternalSignInOutcome.SignedIn);

        var result = await controller.GoogleComplete(returnUrl, CancellationToken.None);

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be(expected);
    }

    [Theory]
    [InlineData(ExternalSignInOutcome.NoExternalLogin)]
    [InlineData(ExternalSignInOutcome.EmailNotVerified)]
    [InlineData(ExternalSignInOutcome.AccountNotLinked)]
    public async Task Google_complete_that_fails_comes_back_to_sign_in_with_the_error(ExternalSignInOutcome outcome)
    {
        auth.SignInWithExternalLoginAsync(Arg.Any<CancellationToken>()).Returns(outcome);

        var result = await controller.GoogleComplete("/reports", CancellationToken.None);

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be("/sign-in?error=google");
    }

    [Theory]
    [InlineData(ExternalSignInOutcome.InvitationRequired, "/sign-in?error=invite-only")]
    [InlineData(ExternalSignInOutcome.InvitationInvalid, "/sign-in?error=invite")]
    [InlineData(ExternalSignInOutcome.Blocked, "/sign-in?error=blocked")]
    public async Task Google_complete_without_access_comes_back_to_sign_in_saying_why(ExternalSignInOutcome outcome, string expected)
    {
        auth.SignInWithExternalLoginAsync(Arg.Any<CancellationToken>()).Returns(outcome);

        var result = await controller.GoogleComplete("/", CancellationToken.None);

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be(expected);
    }

    [Fact]
    public void Auth_endpoints_are_open_without_signing_in()
    {
        typeof(AuthController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).Should().ContainSingle();
    }

    [Theory]
    [InlineData(nameof(AuthController.Register))]
    [InlineData(nameof(AuthController.Login))]
    [InlineData(nameof(AuthController.Google))]
    public void Register_login_and_continue_with_google_are_rate_limited(string action)
    {
        var attribute = typeof(AuthController).GetMethod(action)!
            .GetCustomAttributes(typeof(EnableRateLimitingAttribute), inherit: false)
            .Should().ContainSingle().Which.Should().BeOfType<EnableRateLimitingAttribute>().Subject;

        attribute.PolicyName.Should().Be(AuthRateLimiting.PolicyName);
    }
}
