namespace PupBudgetPlanner.Application.Auth;

/// <summary>
/// Creating an account with email and password. The display name is what the family sees. While sign-up is
/// invite-only, <paramref name="InviteToken"/> is the token from the invite link (F-028).
/// </summary>
public sealed record RegisterRequest(string DisplayName, string Email, string Password, string? InviteToken = null);

public sealed record SignInRequest(string Email, string Password);

/// <summary>The signed-in person, as the app shows them. The admin also sees the People page (F-028).</summary>
public sealed record CurrentUser(Guid Id, string DisplayName, string Email, bool IsAdmin = false);

public enum RegisterOutcome
{
    Registered,

    /// <summary>
    /// The account wasn't created because of the email. Callers must not say that an account with it exists
    /// (ADR 0012).
    /// </summary>
    EmailUnavailable,

    /// <summary>Sign-up is invite-only and the request has no invite token (F-028).</summary>
    InvitationRequired,

    /// <summary>The invite link was used, expired, cancelled or never existed; these are never told apart.</summary>
    InvitationInvalid,
}

public sealed record RegisterResult(RegisterOutcome Outcome, CurrentUser? User = null);

public enum SignInOutcome
{
    SignedIn,

    /// <summary>Unknown email or wrong password; the two are never told apart (ADR 0012).</summary>
    InvalidCredentials,

    /// <summary>Too many wrong passwords in a row; signing in is blocked for a while.</summary>
    LockedOut,

    /// <summary>The admin took the person's access away (F-028). Only said after the right password.</summary>
    Blocked,
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

    /// <summary>A Google account with no account here, and no invite link while sign-up is invite-only.</summary>
    InvitationRequired,

    /// <summary>A Google account with no account here came with a link that doesn't work (any more).</summary>
    InvitationInvalid,

    /// <summary>The admin took the person's access away (F-028).</summary>
    Blocked,
}
