using System.Security.Claims;

namespace PupBudgetPlanner.Application.Auth;

/// <summary>Accounts and the sign-in cookie. Implemented with ASP.NET Core Identity in Infrastructure.</summary>
public interface IAuthService
{
    /// <summary>Creates the account and signs the person in.</summary>
    Task<RegisterResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Checks the password and signs the person in. Takes about as long for an unknown email as for a known one.
    /// </summary>
    Task<SignInAttempt> SignInAsync(SignInRequest request, CancellationToken cancellationToken);

    Task SignOutAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Signs in with the login an external provider (Google) has just confirmed. The first time, it creates the
    /// account, or links the login to the account with the same verified email (F-012).
    /// </summary>
    Task<ExternalSignInOutcome> SignInWithExternalLoginAsync(CancellationToken cancellationToken);

    /// <summary>The person behind the request's cookie, or null when nobody is signed in.</summary>
    Task<CurrentUser?> GetCurrentUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken);
}
