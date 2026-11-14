using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Identity;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Tests.Identity;

/// <summary>
/// Deleting one's own account (F-027): every check made before the database is touched, and "Confirm with Google".
/// The deletion itself (the family, the cascade) is covered by the E2E test against a real database.
/// </summary>
public sealed class AccountDeletionServiceTests
{
    private readonly UserManager<AppUser> userManager = Substitute.For<UserManager<AppUser>>(
        Substitute.For<IUserStore<AppUser>>(), null, null, null, null, null, null, null, null);

    private readonly SignInManager<AppUser> signInManager;
    private readonly IAuthenticationService authentication = Substitute.For<IAuthenticationService>();
    private readonly AccountDeletionService service;

    private readonly AppUser olena = new()
    {
        Id = Guid.CreateVersion7(),
        UserName = "olena@example.com",
        Email = "olena@example.com",
        DisplayName = "Olena",
        PasswordHash = "hash",
    };

    public AccountDeletionServiceTests()
    {
        signInManager = Substitute.For<SignInManager<AppUser>>(
            userManager,
            Substitute.For<IHttpContextAccessor>(),
            Substitute.For<IUserClaimsPrincipalFactory<AppUser>>(),
            Substitute.For<IOptions<IdentityOptions>>(),
            null,
            null,
            null);
        signInManager.Context = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddSingleton(authentication).BuildServiceProvider(),
        };
        // Never opened: every case here ends before the database
        var dbContext = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=nowhere.invalid").Options);
        var access = new AccessOptions();
        access.AdminEmails.Add("admin@example.com");
        service = new AccountDeletionService(
            dbContext, userManager, signInManager, Options.Create(access), TimeProvider.System);
        userManager.FindByIdAsync(olena.Id.ToString()).Returns(olena);
    }

    private Task<DeleteMyAccountOutcome> Delete(
        string word = "DELETE", string? password = "pup-budget", bool googleConfirmed = false) =>
        service.DeleteAsync(olena.Id, new DeleteMyAccountRequest(word, password, null), googleConfirmed, CancellationToken.None);

    [Fact]
    public async Task An_account_that_is_gone_is_not_found()
    {
        var outcome = await service.DeleteAsync(
            Guid.CreateVersion7(), new DeleteMyAccountRequest("DELETE", "x", null), false, CancellationToken.None);

        outcome.Should().Be(DeleteMyAccountOutcome.NotFound);
    }

    [Fact]
    public async Task The_admin_cant_delete_their_own_account()
    {
        olena.Email = "Admin@Example.com";

        (await Delete()).Should().Be(DeleteMyAccountOutcome.IsAdmin);
        await userManager.DidNotReceive().DeleteAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task A_wrong_word_deletes_nothing_and_checks_no_password()
    {
        (await Delete(word: "remove")).Should().Be(DeleteMyAccountOutcome.WrongWord);
        await signInManager.DidNotReceive().CheckPasswordSignInAsync(Arg.Any<AppUser>(), Arg.Any<string>(), Arg.Any<bool>());
    }

    [Fact]
    public async Task A_wrong_password_counts_towards_the_lockout()
    {
        signInManager.CheckPasswordSignInAsync(olena, "wrong", lockoutOnFailure: true).Returns(SignInResult.Failed);

        (await Delete(password: "wrong")).Should().Be(DeleteMyAccountOutcome.WrongPassword);
        await userManager.DidNotReceive().DeleteAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task A_locked_out_account_is_told_to_wait()
    {
        signInManager.CheckPasswordSignInAsync(olena, "pup-budget", lockoutOnFailure: true).Returns(SignInResult.LockedOut);

        (await Delete()).Should().Be(DeleteMyAccountOutcome.LockedOut);
    }

    [Fact]
    public async Task Someone_with_only_Google_must_confirm_with_it()
    {
        olena.PasswordHash = null;

        (await Delete(password: null)).Should().Be(DeleteMyAccountOutcome.GoogleNotConfirmed);
        await userManager.DidNotReceive().DeleteAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task Their_own_Google_account_confirms_and_signs_nobody_in()
    {
        GoogleGives("google-olena");
        userManager.FindByLoginAsync("Google", "google-olena").Returns(olena);

        (await service.IsOwnGoogleLoginAsync(olena.Id, CancellationToken.None)).Should().BeTrue();
        await authentication.Received(1).SignOutAsync(
            Arg.Any<HttpContext>(), IdentityConstants.ExternalScheme, Arg.Any<AuthenticationProperties?>());
        await signInManager.DidNotReceive().SignInAsync(Arg.Any<AppUser>(), Arg.Any<bool>(), Arg.Any<string?>());
    }

    [Fact]
    public async Task Someone_elses_Google_account_doesnt_confirm()
    {
        GoogleGives("google-andriy");
        userManager.FindByLoginAsync("Google", "google-andriy").Returns(new AppUser { Id = Guid.CreateVersion7() });

        (await service.IsOwnGoogleLoginAsync(olena.Id, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task No_Google_login_doesnt_confirm()
    {
        signInManager.GetExternalLoginInfoAsync().Returns((ExternalLoginInfo?)null);

        (await service.IsOwnGoogleLoginAsync(olena.Id, CancellationToken.None)).Should().BeFalse();
    }

    private void GoogleGives(string key)
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, key)], "Google"));
        signInManager.GetExternalLoginInfoAsync().Returns(new ExternalLoginInfo(principal, "Google", key, "Google"));
    }
}
