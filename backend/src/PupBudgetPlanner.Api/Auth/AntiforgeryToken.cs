using Microsoft.AspNetCore.Antiforgery;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>
/// The SPA's antiforgery token. The API puts it in a cookie the app can read; the app sends it back in a header
/// on every request that changes something, which another site can't do (ADR 0003).
/// </summary>
public static class AntiforgeryToken
{
    public const string CookieName = "XSRF-TOKEN";

    public const string HeaderName = "X-XSRF-TOKEN";

    /// <summary>
    /// Issues a token for the person behind this request. Signing in or out changes who that is, so the app
    /// asks for a new one (<c>GET /api/auth/me</c>) afterwards.
    /// </summary>
    public static void Issue(IAntiforgery antiforgery, HttpContext context)
    {
        var tokens = antiforgery.GetAndStoreTokens(context);
        context.Response.Cookies.Append(CookieName, tokens.RequestToken ?? string.Empty, new CookieOptions
        {
            HttpOnly = false,
            SameSite = SameSiteMode.Strict,
            Secure = context.Request.IsHttps,
            Path = "/",
        });
    }
}
