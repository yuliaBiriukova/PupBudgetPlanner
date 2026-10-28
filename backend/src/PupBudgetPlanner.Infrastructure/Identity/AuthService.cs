using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Infrastructure.Identity;

internal sealed class AuthService(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IPasswordHasher<AppUser> passwordHasher) : IAuthService
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

        var created = await userManager.CreateAsync(user, request.Password);
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
}
