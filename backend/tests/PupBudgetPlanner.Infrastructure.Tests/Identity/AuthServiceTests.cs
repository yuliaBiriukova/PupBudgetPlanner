using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Identity;
using IdentitySignInResult = Microsoft.AspNetCore.Identity.SignInResult;

namespace PupBudgetPlanner.Infrastructure.Tests.Identity;

public sealed class AuthServiceTests
{
    private readonly UserManager<AppUser> userManager = Substitute.For<UserManager<AppUser>>(
        Substitute.For<IUserStore<AppUser>>(), null, null, null, null, null, null, null, null);

    private readonly SignInManager<AppUser> signInManager;
    private readonly IPasswordHasher<AppUser> passwordHasher = Substitute.For<IPasswordHasher<AppUser>>();
    private readonly IAccountCreator accountCreator = Substitute.For<IAccountCreator>();
    private readonly AuthService service;

    public AuthServiceTests()
    {
        signInManager = Substitute.For<SignInManager<AppUser>>(
            userManager,
            Substitute.For<IHttpContextAccessor>(),
            Substitute.For<IUserClaimsPrincipalFactory<AppUser>>(),
            Substitute.For<IOptions<IdentityOptions>>(),
            null,
            null,
            null);
        service = new AuthService(userManager, signInManager, passwordHasher, accountCreator);
    }

    private static readonly AppUser Olena = new()
    {
        Id = Guid.CreateVersion7(),
        UserName = "olena@example.com",
        Email = "olena@example.com",
        DisplayName = "Olena",
    };

    [Fact]
    public async Task Register_creates_the_account_with_the_email_as_user_name_and_signs_in()
    {
        accountCreator.CreateAsync(Arg.Any<AppUser>(), "kyiv-budget-26", Arg.Any<CancellationToken>()).Returns(IdentityResult.Success);

        var result = await service.RegisterAsync(
            new RegisterRequest("  Olena ", " olena@example.com ", "kyiv-budget-26"), CancellationToken.None);

        result.Outcome.Should().Be(RegisterOutcome.Registered);
        result.User.Should().BeEquivalentTo(new { DisplayName = "Olena", Email = "olena@example.com" });
        await accountCreator.Received(1).CreateAsync(
            Arg.Is<AppUser>(u => u.UserName == "olena@example.com" && u.Email == "olena@example.com" && u.DisplayName == "Olena"),
            "kyiv-budget-26",
            Arg.Any<CancellationToken>());
        await signInManager.Received(1).SignInAsync(Arg.Any<AppUser>(), true, null);
    }

    [Fact]
    public async Task Register_reports_an_unavailable_email_and_does_not_sign_in()
    {
        accountCreator.CreateAsync(Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(IdentityResult.Failed(new IdentityErrorDescriber().DuplicateEmail("olena@example.com")));

        var result = await service.RegisterAsync(
            new RegisterRequest("Olena", "olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Should().Be(new RegisterResult(RegisterOutcome.EmailUnavailable));
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task Sign_in_with_the_right_password_signs_in_with_a_lasting_cookie()
    {
        userManager.FindByEmailAsync("olena@example.com").Returns(Olena);
        signInManager.PasswordSignInAsync(Olena, "kyiv-budget-26", true, true).Returns(IdentitySignInResult.Success);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Should().Be(new SignInAttempt(SignInOutcome.SignedIn, new CurrentUser(Olena.Id, "Olena", "olena@example.com")));
    }

    [Fact]
    public async Task Sign_in_with_a_wrong_password_counts_towards_lockout()
    {
        userManager.FindByEmailAsync("olena@example.com").Returns(Olena);
        signInManager.PasswordSignInAsync(Olena, "wrong", true, true).Returns(IdentitySignInResult.Failed);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "wrong"), CancellationToken.None);

        result.Should().Be(new SignInAttempt(SignInOutcome.InvalidCredentials));
        await signInManager.Received(1).PasswordSignInAsync(Olena, "wrong", true, lockoutOnFailure: true);
    }

    [Fact]
    public async Task Sign_in_with_an_unknown_email_looks_like_a_wrong_password_and_still_checks_a_hash()
    {
        userManager.FindByEmailAsync("nobody@example.com").Returns((AppUser?)null);

        var result = await service.SignInAsync(new SignInRequest("nobody@example.com", "whatever"), CancellationToken.None);

        result.Should().Be(new SignInAttempt(SignInOutcome.InvalidCredentials));
        passwordHasher.Received(1).VerifyHashedPassword(Arg.Any<AppUser>(), Arg.Any<string>(), "whatever");
    }

    [Fact]
    public async Task Sign_in_while_locked_out_says_so()
    {
        userManager.FindByEmailAsync("olena@example.com").Returns(Olena);
        signInManager.PasswordSignInAsync(Olena, Arg.Any<string>(), true, true).Returns(IdentitySignInResult.LockedOut);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Outcome.Should().Be(SignInOutcome.LockedOut);
    }

    [Fact]
    public async Task Current_user_is_null_without_a_signed_in_person()
    {
        var result = await service.GetCurrentUserAsync(new ClaimsPrincipal(new ClaimsIdentity()), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task Current_user_is_null_when_the_cookie_outlived_the_account()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "x")], "cookie"));
        userManager.GetUserAsync(principal).Returns((AppUser?)null);

        var result = await service.GetCurrentUserAsync(principal, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task Current_user_is_the_signed_in_person()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "x")], "cookie"));
        userManager.GetUserAsync(principal).Returns(Olena);

        var result = await service.GetCurrentUserAsync(principal, CancellationToken.None);

        result.Should().Be(new CurrentUser(Olena.Id, "Olena", "olena@example.com"));
    }
}
