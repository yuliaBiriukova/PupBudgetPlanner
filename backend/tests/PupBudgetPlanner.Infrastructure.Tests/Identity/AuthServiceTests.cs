using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Application.Access;
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
    private readonly AccessOptions access = new() { SignUp = SignUpMode.Open };
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
        service = new AuthService(userManager, signInManager, passwordHasher, accountCreator, Options.Create(access));
    }

    private static AppUser Olena() => new()
    {
        Id = Guid.CreateVersion7(),
        UserName = "olena@example.com",
        Email = "olena@example.com",
        DisplayName = "Olena",
    };

    private static RegisterRequest OlenasSignUp(string? inviteToken = null) =>
        new("Olena", "olena@example.com", "kyiv-budget-26", inviteToken);

    [Fact]
    public async Task Register_creates_the_account_with_the_email_as_user_name_and_signs_in()
    {
        accountCreator.CreateAsync(Arg.Any<AppUser>(), "kyiv-budget-26", null, Arg.Any<CancellationToken>())
            .Returns(AccountCreation.Created);

        var result = await service.RegisterAsync(
            new RegisterRequest("  Olena ", " olena@example.com ", "kyiv-budget-26"), CancellationToken.None);

        result.Outcome.Should().Be(RegisterOutcome.Registered);
        result.User.Should().BeEquivalentTo(new { DisplayName = "Olena", Email = "olena@example.com" });
        await accountCreator.Received(1).CreateAsync(
            Arg.Is<AppUser>(u => u.UserName == "olena@example.com" && u.Email == "olena@example.com" && u.DisplayName == "Olena"),
            "kyiv-budget-26",
            null,
            Arg.Any<CancellationToken>());
        await signInManager.Received(1).SignInAsync(Arg.Any<AppUser>(), true, null);
    }

    [Fact]
    public async Task Register_reports_an_unavailable_email_and_does_not_sign_in()
    {
        accountCreator.CreateAsync(Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Any<InvitationUse?>(), Arg.Any<CancellationToken>())
            .Returns(AccountCreation.Refused);

        var result = await service.RegisterAsync(OlenasSignUp(), CancellationToken.None);

        result.Should().Be(new RegisterResult(RegisterOutcome.EmailUnavailable));
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task Register_while_invite_only_needs_a_link_and_creates_nothing_without_one()
    {
        access.SignUp = SignUpMode.InviteOnly;

        var result = await service.RegisterAsync(OlenasSignUp(), CancellationToken.None);

        result.Should().Be(new RegisterResult(RegisterOutcome.InvitationRequired));
        await accountCreator.DidNotReceive().CreateAsync(
            Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Any<InvitationUse?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_while_invite_only_uses_up_the_link_with_the_account()
    {
        access.SignUp = SignUpMode.InviteOnly;
        accountCreator.CreateAsync(Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Any<InvitationUse?>(), Arg.Any<CancellationToken>())
            .Returns(AccountCreation.Created);

        var result = await service.RegisterAsync(OlenasSignUp("the-token"), CancellationToken.None);

        result.Outcome.Should().Be(RegisterOutcome.Registered);
        await accountCreator.Received(1).CreateAsync(
            Arg.Any<AppUser>(),
            "kyiv-budget-26",
            Arg.Is<InvitationUse?>(i => i != null && i.Required && i.TokenHash.Length == 32),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_with_a_link_that_does_not_work_is_refused_and_does_not_sign_in()
    {
        access.SignUp = SignUpMode.InviteOnly;
        accountCreator.CreateAsync(Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Any<InvitationUse?>(), Arg.Any<CancellationToken>())
            .Returns(AccountCreation.InvitationInvalid);

        var result = await service.RegisterAsync(OlenasSignUp("used-token"), CancellationToken.None);

        result.Should().Be(new RegisterResult(RegisterOutcome.InvitationInvalid));
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task Register_while_open_uses_a_link_when_given_but_does_not_require_it()
    {
        accountCreator.CreateAsync(Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Any<InvitationUse?>(), Arg.Any<CancellationToken>())
            .Returns(AccountCreation.Created);

        await service.RegisterAsync(OlenasSignUp("the-token"), CancellationToken.None);

        await accountCreator.Received(1).CreateAsync(
            Arg.Any<AppUser>(), Arg.Any<string?>(), Arg.Is<InvitationUse?>(i => i != null && !i.Required), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(true, null)]
    [InlineData(false, RegisterOutcome.InvitationRequired)]
    public async Task Register_of_the_admin_email_needs_no_link_only_where_password_sign_up_is_allowed(
        bool adminPasswordSignUp, RegisterOutcome? refusal)
    {
        access.SignUp = SignUpMode.InviteOnly;
        access.AdminEmails.Add("Olena@Example.com");
        access.AdminPasswordSignUp = adminPasswordSignUp;
        accountCreator.CreateAsync(Arg.Any<AppUser>(), Arg.Any<string?>(), null, Arg.Any<CancellationToken>())
            .Returns(AccountCreation.Created);

        var result = await service.RegisterAsync(OlenasSignUp(), CancellationToken.None);

        result.Outcome.Should().Be(refusal ?? RegisterOutcome.Registered);
        if (refusal is null)
        {
            result.User!.IsAdmin.Should().BeTrue();
        }
    }

    [Fact]
    public async Task Sign_in_with_the_right_password_signs_in_with_a_lasting_cookie()
    {
        var olena = Olena();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        signInManager.CheckPasswordSignInAsync(olena, "kyiv-budget-26", true).Returns(IdentitySignInResult.Success);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Should().Be(new SignInAttempt(SignInOutcome.SignedIn, new CurrentUser(olena.Id, "Olena", "olena@example.com")));
        await signInManager.Received(1).SignInAsync(olena, true, null);
    }

    [Fact]
    public async Task Sign_in_with_a_wrong_password_counts_towards_lockout()
    {
        var olena = Olena();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        signInManager.CheckPasswordSignInAsync(olena, "wrong", true).Returns(IdentitySignInResult.Failed);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "wrong"), CancellationToken.None);

        result.Should().Be(new SignInAttempt(SignInOutcome.InvalidCredentials));
        await signInManager.Received(1).CheckPasswordSignInAsync(olena, "wrong", lockoutOnFailure: true);
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
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
        var olena = Olena();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        signInManager.CheckPasswordSignInAsync(olena, Arg.Any<string>(), true).Returns(IdentitySignInResult.LockedOut);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Outcome.Should().Be(SignInOutcome.LockedOut);
    }

    [Fact]
    public async Task Sign_in_of_a_blocked_person_with_the_right_password_says_so_and_sets_no_cookie()
    {
        var olena = Olena();
        olena.BlockedAt = DateTimeOffset.UtcNow;
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        signInManager.CheckPasswordSignInAsync(olena, "kyiv-budget-26", true).Returns(IdentitySignInResult.Success);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "kyiv-budget-26"), CancellationToken.None);

        result.Should().Be(new SignInAttempt(SignInOutcome.Blocked));
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task Sign_in_of_a_blocked_person_with_a_wrong_password_does_not_tell_they_are_blocked()
    {
        var olena = Olena();
        olena.BlockedAt = DateTimeOffset.UtcNow;
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        signInManager.CheckPasswordSignInAsync(olena, "wrong", true).Returns(IdentitySignInResult.Failed);

        var result = await service.SignInAsync(new SignInRequest("olena@example.com", "wrong"), CancellationToken.None);

        result.Outcome.Should().Be(SignInOutcome.InvalidCredentials);
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
    public async Task Current_user_is_null_when_the_person_is_blocked()
    {
        var olena = Olena();
        olena.BlockedAt = DateTimeOffset.UtcNow;
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "x")], "cookie"));
        userManager.GetUserAsync(principal).Returns(olena);

        var result = await service.GetCurrentUserAsync(principal, CancellationToken.None);

        result.Should().BeNull();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Current_user_is_the_signed_in_person_and_says_whether_they_are_the_admin(bool admin)
    {
        var olena = Olena();
        if (admin)
        {
            access.AdminEmails.Add("olena@example.com");
        }

        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "x")], "cookie"));
        userManager.GetUserAsync(principal).Returns(olena);

        var result = await service.GetCurrentUserAsync(principal, CancellationToken.None);

        result.Should().Be(new CurrentUser(olena.Id, "Olena", "olena@example.com", admin));
    }
}
