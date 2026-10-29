namespace PupBudgetPlanner.Application.Access;

/// <summary>Who may create an account (F-028).</summary>
public enum SignUpMode
{
    /// <summary>Only with an invite link from the admin (the default while the app is for family and friends).</summary>
    InviteOnly,

    /// <summary>Anyone can create an account; invite links still work.</summary>
    Open,
}

/// <summary>
/// The <c>Access</c> settings (F-028, ADR 0016). The admin is named by email in configuration only: locally in
/// user-secrets, on Render in <c>Access__AdminEmails__0</c>; nothing in the app can make someone an admin.
/// </summary>
public sealed class AccessOptions
{
    public const string SectionName = "Access";

    public SignUpMode SignUp { get; set; } = SignUpMode.InviteOnly;

    /// <summary>Emails of the admins (one for now; a list so a second one can be added later).</summary>
    public IList<string> AdminEmails { get; } = [];

    /// <summary>
    /// Whether an admin email may create its account with a password and no invitation. Only in Development (the
    /// E2E tests); elsewhere the admin's first sign-in is with Google, which has verified the email.
    /// </summary>
    public bool AdminPasswordSignUp { get; set; }

    public bool IsAdmin(string? email) =>
        !string.IsNullOrWhiteSpace(email)
        && AdminEmails.Any(admin => string.Equals(admin.Trim(), email.Trim(), StringComparison.OrdinalIgnoreCase));
}
