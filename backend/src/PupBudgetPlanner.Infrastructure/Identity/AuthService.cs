using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Infrastructure.Identity;

internal sealed class AuthService(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IPasswordHasher<AppUser> passwordHasher,
    IAccountCreator accountCreator) : IAuthService
{
    /// <summary>
    /// A real hash of a throwaway password, checked when the email is unknown, so that answer takes as long
    /// as a wrong password (ADR 0012).
    /// </summary>
    private static readonly Lazy<string> DummyHash =
        new(() => new PasswordHasher<AppUser>().HashPassword(new AppUser(), Guid.NewGuid().ToString()));

    public async Task<RegisterResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        var user = new AppUser
        {
            Id = Guid.CreateVersion7(),
            UserName = email,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
        };

        var created = await accountCreator.CreateAsync(user, request.Password, cancellationToken);
        if (!created.Succeeded)
        {
            // The validator checked everything else; a failure here is the email being taken
            return new RegisterResult(RegisterOutcome.EmailUnavailable);
        }

        await signInManager.SignInAsync(user, isPersistent: true);
        return new RegisterResult(RegisterOutcome.Registered, ToCurrentUser(user));
    }

    public async Task<SignInAttempt> SignInAsync(SignInRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            passwordHasher.VerifyHashedPassword(new AppUser(), DummyHash.Value, request.Password);
            return new SignInAttempt(SignInOutcome.InvalidCredentials);
        }

        var result = await signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: true, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return new SignInAttempt(SignInOutcome.LockedOut);
        }

        return result.Succeeded
            ? new SignInAttempt(SignInOutcome.SignedIn, ToCurrentUser(user))
            : new SignInAttempt(SignInOutcome.InvalidCredentials);
    }

    public Task SignOutAsync(CancellationToken cancellationToken) => signInManager.SignOutAsync();

    public async Task<ExternalSignInOutcome> SignInWithExternalLoginAsync(CancellationToken cancellationToken)
    {
        var login = await signInManager.GetExternalLoginInfoAsync();
        if (login is null)
        {
            return ExternalSignInOutcome.NoExternalLogin;
        }

        var user = await userManager.FindByLoginAsync(login.LoginProvider, login.ProviderKey);
        if (user is null)
        {
            var email = login.Principal.FindFirstValue(ClaimTypes.Email)?.Trim();
            if (string.IsNullOrEmpty(email) || !IsEmailVerified(login.Principal))
            {
                return ExternalSignInOutcome.EmailNotVerified;
            }

            var existing = await userManager.FindByEmailAsync(email);
            user = existing is null
                ? await CreateAsync(email, login, cancellationToken)
                : await LinkAsync(existing, login);
            if (user is null)
            {
                return ExternalSignInOutcome.AccountNotLinked;
            }
        }

        // Lockout counts wrong passwords; it doesn't stop a login the provider has just confirmed
        await signInManager.SignInAsync(user, isPersistent: true, authenticationMethod: login.LoginProvider);
        await signInManager.Context.SignOutAsync(IdentityConstants.ExternalScheme);
        return ExternalSignInOutcome.SignedIn;
    }


    public async Task<CurrentUser?> GetCurrentUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        // A cookie can outlive its account (deleted user): treat it as signed out
        var user = await userManager.GetUserAsync(principal);
        return user is null ? null : ToCurrentUser(user);
    }

    private static CurrentUser ToCurrentUser(AppUser user) =>
        new(user.Id, user.DisplayName, user.Email ?? string.Empty);

    private static bool IsEmailVerified(ClaimsPrincipal principal) =>
        bool.TryParse(principal.FindFirstValue(ExternalClaims.EmailVerified), out var verified) && verified;

    /// <summary>A new account for the provider's person: the email is confirmed and there is no password.</summary>
    private async Task<AppUser?> CreateAsync(string email, ExternalLoginInfo login, CancellationToken cancellationToken)
    {
        var user = new AppUser
        {
            Id = Guid.CreateVersion7(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = DisplayNameOf(login.Principal, email),
        };

        var created = await accountCreator.CreateAsync(user, password: null, cancellationToken);
        return created.Succeeded ? await AddLoginAsync(user, login) : null;
    }

    /// <summary>
    /// Links the login to the account with the same email. Until now nobody had proved that email, so a password
    /// set on the account may be someone else's: it is removed, and the new security stamp signs out the other
    /// sessions (owner's choice in F-012).
    /// </summary>
    private async Task<AppUser?> LinkAsync(AppUser user, ExternalLoginInfo login)
    {
        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            user.AccessFailedCount = 0;
            user.LockoutEnd = null;

            // Both save the changes above along with a new security stamp
            var updated = await userManager.HasPasswordAsync(user)
                ? await userManager.RemovePasswordAsync(user)
                : await userManager.UpdateSecurityStampAsync(user);
            if (!updated.Succeeded)
            {
                return null;
            }
        }

        return await AddLoginAsync(user, login);
    }

    private async Task<AppUser?> AddLoginAsync(AppUser user, ExternalLoginInfo login)
    {
        var added = await userManager.AddLoginAsync(user, login);
        return added.Succeeded ? user : null;
    }

    /// <summary>The name from the provider, or the part of the email before the "@".</summary>
    private static string DisplayNameOf(ClaimsPrincipal principal, string email)
    {
        var name = principal.FindFirstValue(ClaimTypes.Name)?.Trim();
        if (string.IsNullOrEmpty(name))
        {
            name = email.Split('@')[0];
        }

        return name.Length <= AuthLimits.DisplayNameMaxLength ? name : name[..AuthLimits.DisplayNameMaxLength].TrimEnd();
    }

}
