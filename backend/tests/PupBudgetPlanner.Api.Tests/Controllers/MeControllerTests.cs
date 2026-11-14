using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Tests.Controllers;

/// <summary>Deleting one's own account (F-027).</summary>
public sealed class MeControllerTests
{
    private static readonly Guid OlenaId = Guid.CreateVersion7();

    private readonly IAccountDeletionService deletion = Substitute.For<IAccountDeletionService>();
    private readonly IAuthService auth = Substitute.For<IAuthService>();
    private readonly IServiceProvider services;
    private readonly MeController controller;

    public MeControllerTests()
    {
        var collection = new ServiceCollection().AddProblemDetails();
        collection.AddMvcCore();
        collection.AddSingleton<IDataProtectionProvider>(new EphemeralDataProtectionProvider());
        services = collection.BuildServiceProvider();
        controller = NewController(Context());
    }

    private DefaultHttpContext Context(string? cookie = null)
    {
        var context = new DefaultHttpContext
        {
            RequestServices = services,
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, OlenaId.ToString())], "cookie")),
        };
        if (cookie is not null)
        {
            context.Request.Headers.Cookie = $"{GoogleConfirmation.CookieName}={cookie}";
        }

        return context;
    }

    private MeController NewController(HttpContext context) =>
        new(deletion, auth, NullLogger<MeController>.Instance) { ControllerContext = new ControllerContext { HttpContext = context } };

    private static DeleteMyAccountRequest Request() => new("DELETE", "pup-budget", null);

    [Fact]
    public async Task The_summary_says_what_goes()
    {
        var summary = new DeletionSummary(9, 1284, 46, HasPassword: true, CanDelete: true, GoogleConfirmed: false);
        deletion.SummaryAsync(OlenaId, false, Arg.Any<CancellationToken>()).Returns(summary);

        var result = await controller.Deletion(CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(summary);
    }

    [Fact]
    public async Task A_deleted_account_signs_out_and_answers_204()
    {
        deletion.DeleteAsync(OlenaId, Arg.Any<DeleteMyAccountRequest>(), false, Arg.Any<CancellationToken>())
            .Returns(DeleteMyAccountOutcome.Deleted);

        var result = await controller.Delete(Request(), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        await auth.Received(1).SignOutAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(DeleteMyAccountOutcome.NotFound, StatusCodes.Status404NotFound)]
    [InlineData(DeleteMyAccountOutcome.IsAdmin, StatusCodes.Status403Forbidden)]
    [InlineData(DeleteMyAccountOutcome.LockedOut, StatusCodes.Status429TooManyRequests)]
    [InlineData(DeleteMyAccountOutcome.GoogleNotConfirmed, StatusCodes.Status409Conflict)]
    public async Task Refusals_map_to_status_codes(DeleteMyAccountOutcome outcome, int status)
    {
        deletion.DeleteAsync(OlenaId, Arg.Any<DeleteMyAccountRequest>(), false, Arg.Any<CancellationToken>()).Returns(outcome);

        var result = await controller.Delete(Request(), CancellationToken.None);

        (result as IStatusCodeActionResult)!.StatusCode.Should().Be(status);
        await auth.DidNotReceive().SignOutAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(DeleteMyAccountOutcome.WrongWord, "word")]
    [InlineData(DeleteMyAccountOutcome.PasswordNeeded, "password")]
    [InlineData(DeleteMyAccountOutcome.WrongPassword, "password")]
    [InlineData(DeleteMyAccountOutcome.NewOwnerNeeded, "newOwnerId")]
    [InlineData(DeleteMyAccountOutcome.NoSuchNewOwner, "newOwnerId")]
    public async Task A_wrong_answer_is_said_under_its_field(DeleteMyAccountOutcome outcome, string field)
    {
        deletion.DeleteAsync(OlenaId, Arg.Any<DeleteMyAccountRequest>(), false, Arg.Any<CancellationToken>()).Returns(outcome);

        var result = await controller.Delete(Request(), CancellationToken.None);

        var problem = result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>().Which;
        problem.Errors.Should().ContainKey(field);
    }

    [Fact]
    public async Task Confirm_with_Google_goes_to_Google_and_lands_back_on_Settings()
    {
        var schemes = Substitute.For<IAuthenticationSchemeProvider>();
        schemes.GetSchemeAsync(GoogleSignIn.Scheme)
            .Returns(new AuthenticationScheme(GoogleSignIn.Scheme, "Google", typeof(GoogleHandler)));

        var result = await controller.ConfirmWithGoogle(schemes);

        var challenge = result.Should().BeOfType<ChallengeResult>().Which;
        challenge.AuthenticationSchemes.Should().Equal(GoogleSignIn.Scheme);
        challenge.Properties!.RedirectUri.Should().Be("/api/me/delete/google/complete");
        challenge.Properties.Items.Should().Contain(GoogleSignIn.CancelledPathItem, GoogleConfirmation.CancelledPath);
        challenge.Properties.Items.Should().Contain(GoogleSignIn.FailedPathItem, GoogleConfirmation.FailedPath);
    }

    [Fact]
    public async Task Without_Google_set_up_it_comes_back_failed()
    {
        var result = await controller.ConfirmWithGoogle(Substitute.For<IAuthenticationSchemeProvider>());

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be(GoogleConfirmation.FailedPath);
    }

    [Fact]
    public async Task Their_own_Google_sets_the_confirmation_that_the_deletion_then_reads()
    {
        deletion.IsOwnGoogleLoginAsync(OlenaId, Arg.Any<CancellationToken>()).Returns(true);
        var context = Context();

        var result = await NewController(context).ConfirmWithGoogleComplete(CancellationToken.None);

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be(GoogleConfirmation.ConfirmedPath);
        var setCookie = context.Response.Headers.SetCookie.ToString();
        setCookie.Should().Contain(GoogleConfirmation.CookieName).And.Contain("httponly").And.Contain("path=/api/me");

        // The next request carries the cookie back
        var value = setCookie.Split(';')[0].Split('=', 2)[1];
        GoogleConfirmation.IsConfirmed(Context(value), OlenaId).Should().BeTrue();
        GoogleConfirmation.IsConfirmed(Context(value), Guid.CreateVersion7()).Should().BeFalse();
    }

    [Fact]
    public async Task Someone_elses_Google_comes_back_failed_and_sets_nothing()
    {
        var context = Context();

        var result = await NewController(context).ConfirmWithGoogleComplete(CancellationToken.None);

        result.Should().BeOfType<RedirectResult>().Which.Url.Should().Be(GoogleConfirmation.FailedPath);
        context.Response.Headers.SetCookie.ToString().Should().BeEmpty();
    }

    [Fact]
    public void A_made_up_cookie_confirms_nothing() =>
        GoogleConfirmation.IsConfirmed(Context("not-a-real-value"), OlenaId).Should().BeFalse();

    [Fact]
    public void Deleting_and_confirming_with_Google_are_rate_limited_like_signing_in()
    {
        foreach (var name in new[] { nameof(MeController.Delete), nameof(MeController.ConfirmWithGoogle) })
        {
            typeof(MeController).GetMethod(name)!.GetCustomAttributes(typeof(EnableRateLimitingAttribute), false)
                .Should().ContainSingle().Which.Should().BeOfType<EnableRateLimitingAttribute>()
                .Which.PolicyName.Should().Be(AuthRateLimiting.PolicyName);
        }
    }

    [Theory]
    [InlineData("/settings?delete=open", "/settings?delete=open")]
    [InlineData("//evil.example.com", "/sign-in")]
    [InlineData(null, "/sign-in")]
    public void A_challenge_names_its_own_landing_page_but_only_in_the_app(string? item, string expected)
    {
        var properties = new AuthenticationProperties();
        if (item is not null)
        {
            properties.Items[GoogleSignIn.CancelledPathItem] = item;
        }

        GoogleSignIn.PathFrom(properties, GoogleSignIn.CancelledPathItem, GoogleSignIn.CancelledPath).Should().Be(expected);
    }
}
