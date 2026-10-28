using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>The sign-in cookie, antiforgery and "signed in by default" (ADR 0003, ADR 0012).</summary>
public static class AuthSetup
{
    public static IServiceCollection AddAuth(
        this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        // Locally the API runs on plain http behind the Vite proxy; everywhere else the cookies are HTTPS-only
        var securePolicy = environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;

        var authentication = services.AddAuthentication(IdentityConstants.ApplicationScheme);
        authentication.AddIdentityCookies(cookies => cookies.ApplicationCookie?.Configure(options =>
        {
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = securePolicy;
            options.ExpireTimeSpan = TimeSpan.FromDays(30);
            options.SlidingExpiration = true;

            // An API answers with status codes; the SPA shows the sign-in page itself
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        }));

        authentication.AddGoogleIfConfigured(configuration);

        // Every endpoint needs a signed-in person unless it says [AllowAnonymous]
        services
            .AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        services.AddAntiforgery(options =>
        {
            options.HeaderName = AntiforgeryToken.HeaderName;
            options.Cookie.SecurePolicy = securePolicy;
        });

        services.AddAuthRateLimiting(configuration);

        return services;
    }
}
