using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Access;

namespace PupBudgetPlanner.Infrastructure.Identity;

internal sealed class AuthService(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IPasswordHasher<AppUser> passwordHasher,
    IAccountCreator accountCreator,
    IOptions<AccessOptions> access) : IAuthService
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
        var options = access.Value;

        // While sign-up is invite-only a link is required; the admin's own password sign-up only in Development
        var required = options.SignUp == SignUpMode.InviteOnly && !(options.AdminPasswordSignUp && options.IsAdmin(email));
        var invitation = InvitationFor(request.InviteToken, required);
        if (required && invitation is null)
        {
            return new RegisterResult(RegisterOutcome.InvitationRequired);
        }

        var user = new AppUser
        {
            Id = Guid.CreateVersion7(),
            UserName = email,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
        };

        switch (await accountCreator.CreateAsync(user, request.Password, invitation, cancellationToken))
        {
            case AccountCreation.Refused:
                // The validator checked everything else; a failure here is the email being taken
                return new RegisterResult(RegisterOutcome.EmailUnavailable);
            case AccountCreation.InvitationInvalid:
                return new RegisterResult(RegisterOutcome.InvitationInvalid);
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

        // The password first, then the cookie: a blocked person is told so only after the right password (F-028)
        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            return new SignInAttempt(SignInOutcome.LockedOut);
        }

        if (!result.Succeeded)
        {
            return new SignInAttempt(SignInOutcome.InvalidCredentials);
        }

        if (user.BlockedAt is not null)
        {
            return new SignInAttempt(SignInOutcome.Blocked);
        }

        await signInManager.SignInAsync(user, isPersistent: true);
        return new SignInAttempt(SignInOutcome.SignedIn, ToCurrentUser(user));
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
            if (existing is null)
            {
                // Google has verified the email, so the admin's first sign-in needs no link
                var options = access.Value;
                var required = options.SignUp == SignUpMode.InviteOnly && !options.IsAdmin(email);
                var invitation = InvitationFor(InviteTokenOf(login), required);
                if (required && invitation is null)
                {
                    return ExternalSignInOutcome.InvitationRequired;
                }

                var (created, outcome) = await CreateAsync(email, login, invitation, cancellationToken);
                if (outcome == AccountCreation.InvitationInvalid)
                {
                    return ExternalSignInOutcome.InvitationInvalid;
                }

                user = created;
            }
            else
            {
                user = await LinkAsync(existing, login);
            }

            if (user is null)
            {
                return ExternalSignInOutcome.AccountNotLinked;
            }
        }

        if (user.BlockedAt is not null)
        {
            await signInManager.Context.SignOutAsync(IdentityConstants.ExternalScheme);
            return ExternalSignInOutcome.Blocked;
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

        // A cookie can outlive its account (deleted) or its access (blocked): treat it as signed out
        var user = await userManager.GetUserAsync(principal);
        return user is null || user.BlockedAt is not null ? null : ToCurrentUser(user);
    }

    private CurrentUser ToCurrentUser(AppUser user) =>
        new(user.Id, user.DisplayName, user.Email ?? string.Empty, access.Value.IsAdmin(user.Email));

    private static InvitationUse? InvitationFor(string? token, bool required) =>
        string.IsNullOrWhiteSpace(token) ? null : new InvitationUse(InvitationToken.Hash(token), required);

    private static string? InviteTokenOf(ExternalLoginInfo login) =>
        login.AuthenticationProperties?.Items.TryGetValue(ExternalClaims.InviteTokenItem, out var token) == true ? token : null;

    private static bool IsEmailVerified(ClaimsPrincipal principal) =>
        bool.TryParse(principal.FindFirstValue(ExternalClaims.EmailVerified), out var verified) && verified;

    /// <summary>A new account for the provider's person: the email is confirmed and there is no password.</summary>
    private async Task<(AppUser? User, AccountCreation Outcome)> CreateAsync(
        string email, ExternalLoginInfo login, InvitationUse? invitation, CancellationToken cancellationToken)
    {
        var user = new AppUser
        {
            Id = Guid.CreateVersion7(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = DisplayNameOf(login.Principal, email),
        };

        var outcome = await accountCreator.CreateAsync(user, password: null, invitation, cancellationToken);
        return outcome == AccountCreation.Created ? (await AddLoginAsync(user, login), outcome) : (null, outcome);
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
