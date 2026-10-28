namespace PupBudgetPlanner.Application.Auth;

/// <summary>Creating an account with email and password. The display name is what the family sees.</summary>
public sealed record RegisterRequest(string DisplayName, string Email, string Password);

public sealed record SignInRequest(string Email, string Password);

/// <summary>The signed-in person, as the app shows them.</summary>
public sealed record CurrentUser(Guid Id, string DisplayName, string Email);

public enum RegisterOutcome
{
    Registered,

    /// <summary>
    /// The account wasn't created because of the email. Callers must not say that an account with it exists
    /// (ADR 0012).
    /// </summary>
    EmailUnavailable,
}

public sealed record RegisterResult(RegisterOutcome Outcome, CurrentUser? User = null);

public enum SignInOutcome
{
    SignedIn,

    /// <summary>Unknown email or wrong password; the two are never told apart (ADR 0012).</summary>
    InvalidCredentials,

    /// <summary>Too many wrong passwords in a row; signing in is blocked for a while.</summary>
    LockedOut,
}

public sealed record SignInAttempt(SignInOutcome Outcome, CurrentUser? User = null);

public enum ExternalSignInOutcome
{
    SignedIn,

    /// <summary>No login from the provider on this request: it expired, or the callback was opened directly.</summary>
    NoExternalLogin,

    /// <summary>The provider didn't give an email it has verified, so it can't be matched to an account.</summary>
    EmailNotVerified,

    /// <summary>Creating the account or linking the login to it failed.</summary>
    AccountNotLinked,
}
