using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Tests.Identity;

/// <summary>"Continue with Google": creating the account or linking the login to it (F-012).</summary>
public sealed class ExternalSignInTests
{
    private readonly UserManager<AppUser> userManager = Substitute.For<UserManager<AppUser>>(
        Substitute.For<IUserStore<AppUser>>(), null, null, null, null, null, null, null, null);

    private readonly SignInManager<AppUser> signInManager;
    private readonly IAuthenticationService authentication = Substitute.For<IAuthenticationService>();
    private readonly AuthService service;

    public ExternalSignInTests()
    {
        signInManager = Substitute.For<SignInManager<AppUser>>(
            userManager,
            Substitute.For<IHttpContextAccessor>(),
            Substitute.For<IUserClaimsPrincipalFactory<AppUser>>(),
            Substitute.For<IOptions<IdentityOptions>>(),
            null,
            null,
            null);
        // Signing out of the external cookie goes through the request's authentication service
        signInManager.Context = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddSingleton(authentication).BuildServiceProvider(),
        };
        service = new AuthService(userManager, signInManager, Substitute.For<IPasswordHasher<AppUser>>());
    }

    private static AppUser Olena(bool emailConfirmed) => new()
    {
        Id = Guid.CreateVersion7(),
        UserName = "olena@example.com",
        Email = "olena@example.com",
        DisplayName = "Olena",
        EmailConfirmed = emailConfirmed,
    };

    private void GoogleGives(
        string? email = "olena@example.com", string? verified = "True", string? name = "Olena Koval")
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "google-123") };
        if (email is not null)
        {
            claims.Add(new Claim(ClaimTypes.Email, email));
        }

        if (verified is not null)
        {
            claims.Add(new Claim(ExternalClaims.EmailVerified, verified));
        }

        if (name is not null)
        {
            claims.Add(new Claim(ClaimTypes.Name, name));
        }

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
        signInManager.GetExternalLoginInfoAsync()
            .Returns(new ExternalLoginInfo(principal, "Google", "google-123", "Google"));
    }

    private void CreatingAccountsWorks()
    {
        userManager.CreateAsync(Arg.Any<AppUser>()).Returns(IdentityResult.Success);
        userManager.AddLoginAsync(Arg.Any<AppUser>(), Arg.Any<UserLoginInfo>()).Returns(IdentityResult.Success);
    }

    [Fact]
    public async Task Without_a_login_from_the_provider_nobody_is_signed_in()
    {
        signInManager.GetExternalLoginInfoAsync().Returns((ExternalLoginInfo?)null);

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.NoExternalLogin);
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task A_known_login_signs_that_person_in_with_a_lasting_cookie_and_drops_the_external_one()
    {
        var olena = Olena(emailConfirmed: true);
        GoogleGives();
        userManager.FindByLoginAsync("Google", "google-123").Returns(olena);

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.SignedIn);
        await signInManager.Received(1).SignInAsync(olena, true, "Google");
        await authentication.Received(1).SignOutAsync(
            Arg.Any<HttpContext>(), IdentityConstants.ExternalScheme, Arg.Any<AuthenticationProperties?>());
        await userManager.DidNotReceive().CreateAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task The_first_sign_in_creates_an_account_with_a_confirmed_email_and_no_password()
    {
        GoogleGives();
        CreatingAccountsWorks();

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.SignedIn);
        await userManager.Received(1).CreateAsync(Arg.Is<AppUser>(u =>
            u.Email == "olena@example.com" && u.UserName == "olena@example.com" && u.EmailConfirmed
            && u.DisplayName == "Olena Koval" && u.PasswordHash == null));
        await userManager.Received(1).AddLoginAsync(
            Arg.Is<AppUser>(u => u.Email == "olena@example.com"),
            Arg.Is<UserLoginInfo>(l => l.LoginProvider == "Google" && l.ProviderKey == "google-123"));
        await signInManager.Received(1).SignInAsync(Arg.Is<AppUser>(u => u.Email == "olena@example.com"), true, "Google");
    }

    [Theory]
    [InlineData(null, "olena")]
    [InlineData("   ", "olena")]
    [InlineData(
        "Olena Oleksandrivna Koval-Shevchenko-Kovalenko-Bondarenko",
        "Olena Oleksandrivna Koval-Shevchenko-Kovalenko-Bon")]
    public async Task A_new_account_takes_the_name_from_the_provider_within_the_limit_or_the_start_of_the_email(
        string? name, string expected)
    {
        GoogleGives(name: name);
        CreatingAccountsWorks();

        await service.SignInWithExternalLoginAsync(CancellationToken.None);

        expected.Length.Should().BeLessThanOrEqualTo(AuthLimits.DisplayNameMaxLength);
        await userManager.Received(1).CreateAsync(Arg.Is<AppUser>(u => u.DisplayName == expected));
    }

    [Theory]
    [InlineData("olena@example.com", "False")]
    [InlineData("olena@example.com", null)]
    [InlineData(null, "True")]
    public async Task Without_a_verified_email_it_fails_before_looking_for_an_account(string? email, string? verified)
    {
        GoogleGives(email: email, verified: verified);

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.EmailNotVerified);
        await userManager.DidNotReceive().FindByEmailAsync(Arg.Any<string>());
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task Linking_to_an_account_whose_email_nobody_proved_removes_its_password_and_lockout()
    {
        var olena = Olena(emailConfirmed: false);
        olena.AccessFailedCount = 3;
        olena.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(10);
        GoogleGives();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        userManager.HasPasswordAsync(olena).Returns(true);
        userManager.RemovePasswordAsync(olena).Returns(IdentityResult.Success);
        userManager.AddLoginAsync(olena, Arg.Any<UserLoginInfo>()).Returns(IdentityResult.Success);

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.SignedIn);
        // Removing the password saves the user with a new security stamp, which signs out the other sessions
        await userManager.Received(1).RemovePasswordAsync(olena);
        olena.EmailConfirmed.Should().BeTrue();
        olena.AccessFailedCount.Should().Be(0);
        olena.LockoutEnd.Should().BeNull();
        await userManager.Received(1).AddLoginAsync(olena, Arg.Is<UserLoginInfo>(l => l.ProviderKey == "google-123"));
        await signInManager.Received(1).SignInAsync(olena, true, "Google");
        await userManager.DidNotReceive().CreateAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task Linking_to_an_unproved_account_without_a_password_still_renews_its_security_stamp()
    {
        var olena = Olena(emailConfirmed: false);
        GoogleGives();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        userManager.HasPasswordAsync(olena).Returns(false);
        userManager.UpdateSecurityStampAsync(olena).Returns(IdentityResult.Success);
        userManager.AddLoginAsync(olena, Arg.Any<UserLoginInfo>()).Returns(IdentityResult.Success);

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.SignedIn);
        await userManager.Received(1).UpdateSecurityStampAsync(olena);
        olena.EmailConfirmed.Should().BeTrue();
    }

    [Fact]
    public async Task Linking_to_an_account_with_a_confirmed_email_leaves_it_as_it_is()
    {
        var olena = Olena(emailConfirmed: true);
        GoogleGives();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        userManager.AddLoginAsync(olena, Arg.Any<UserLoginInfo>()).Returns(IdentityResult.Success);

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.SignedIn);
        await userManager.DidNotReceive().RemovePasswordAsync(Arg.Any<AppUser>());
        await userManager.DidNotReceive().UpdateSecurityStampAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task It_fails_when_the_password_cannot_be_removed()
    {
        var olena = Olena(emailConfirmed: false);
        GoogleGives();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        userManager.HasPasswordAsync(olena).Returns(true);
        userManager.RemovePasswordAsync(olena).Returns(IdentityResult.Failed(new IdentityErrorDescriber().ConcurrencyFailure()));

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.AccountNotLinked);
        await userManager.DidNotReceive().AddLoginAsync(Arg.Any<AppUser>(), Arg.Any<UserLoginInfo>());
    }

    [Fact]
    public async Task It_fails_when_the_login_cannot_be_linked()
    {
        var olena = Olena(emailConfirmed: true);
        GoogleGives();
        userManager.FindByEmailAsync("olena@example.com").Returns(olena);
        userManager.AddLoginAsync(olena, Arg.Any<UserLoginInfo>())
            .Returns(IdentityResult.Failed(new IdentityErrorDescriber().LoginAlreadyAssociated()));

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.AccountNotLinked);
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task It_fails_when_the_account_cannot_be_created()
    {
        GoogleGives();
        userManager.CreateAsync(Arg.Any<AppUser>())
            .Returns(IdentityResult.Failed(new IdentityErrorDescriber().DuplicateEmail("olena@example.com")));

        var outcome = await service.SignInWithExternalLoginAsync(CancellationToken.None);

        outcome.Should().Be(ExternalSignInOutcome.AccountNotLinked);
        await userManager.DidNotReceive().AddLoginAsync(Arg.Any<AppUser>(), Arg.Any<UserLoginInfo>());
    }
}
