using Microsoft.AspNetCore.DataProtection;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>
/// "Confirm with Google" before deleting an account (F-027): after signing in with Google again, a short-lived,
/// encrypted cookie says who did and until when. Nothing is written to the database.
/// </summary>
public static class GoogleConfirmation
{
    public const string CookieName = "pup.delete-confirmed";

    /// <summary>Back on Settings with the dialog open: confirmed, or it didn't work.</summary>
    public const string ConfirmedPath = "/settings?delete=google";

    public const string FailedPath = "/settings?delete=google-failed";

    /// <summary>Cancelled at Google: back on Settings, the dialog open as it was.</summary>
    public const string CancelledPath = "/settings?delete=open";

    private const string Purpose = "PupBudgetPlanner.DeleteAccount.GoogleConfirmation";

    public static void Set(HttpContext context, Guid userId)
    {
        var protector = Protector(context);
        var value = protector.Protect(userId.ToString(), AccountDeletionRules.GoogleConfirmationLifetime);
        context.Response.Cookies.Append(CookieName, value, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = context.Request.IsHttps,
            Path = "/api/me",
            MaxAge = AccountDeletionRules.GoogleConfirmationLifetime,
        });
    }

    /// <summary>Whether this person signed in with Google again within the lifetime.</summary>
    public static bool IsConfirmed(HttpContext context, Guid userId)
    {
        if (!context.Request.Cookies.TryGetValue(CookieName, out var value) || string.IsNullOrEmpty(value))
        {
            return false;
        }

        try
        {
            return Protector(context).Unprotect(value) == userId.ToString();
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            // Expired, tampered with, or from before a key change
            return false;
        }
    }

    public static void Clear(HttpContext context) =>
        context.Response.Cookies.Delete(CookieName, new CookieOptions { Path = "/api/me" });

    private static ITimeLimitedDataProtector Protector(HttpContext context) =>
        context.RequestServices.GetRequiredService<IDataProtectionProvider>()
            .CreateProtector(Purpose)
            .ToTimeLimitedDataProtector();
}
