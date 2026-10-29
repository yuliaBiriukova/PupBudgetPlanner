namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>Claims an external provider's handler must give for its login to be matched to an account.</summary>
public static class ExternalClaims
{
    /// <summary>"true" when the provider has checked that the email belongs to the person (Google's <c>email_verified</c>).</summary>
    public const string EmailVerified = "email_verified";

    /// <summary>
    /// The key of the invite token in the external login's authentication properties: the invite page sends it to
    /// Google and it comes back with the login (F-028).
    /// </summary>
    public const string InviteTokenItem = "invite";
}
