using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>
/// "Continue with Google" (F-012): Identity's external login with the client from Google Cloud Console. Locally the
/// ID and secret come from user-secrets, on Render from environment variables.
/// </summary>
public static partial class GoogleSignIn
{
    public const string ConfigurationSection = "Authentication:Google";

    public const string Scheme = GoogleDefaults.AuthenticationScheme;

    /// <summary>Google sends the person back here; the redirect URI registered with the client must match.</summary>
    public const string CallbackPath = "/api/auth/google/callback";

    /// <summary>Where a failed Google sign-in lands: the sign-in page says it didn't work.</summary>
    public const string FailedPath = "/sign-in?error=google";

    /// <summary>Where a cancelled Google sign-in lands: back to sign in, without an error.</summary>
    public const string CancelledPath = "/sign-in";

    /// <summary>
    /// Adds the Google handler when the client ID and secret are set. Without them the app still starts (tests,
    /// the container check in CI) and "Continue with Google" comes back with the error.
    /// </summary>
    public static AuthenticationBuilder AddGoogleIfConfigured(
        this AuthenticationBuilder authentication, IConfiguration configuration)
    {
        var section = configuration.GetSection(ConfigurationSection);
        var clientId = section["ClientId"];
        var clientSecret = section["ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return authentication;
        }

        return authentication.AddGoogle(Scheme, options =>
        {
            options.ClientId = clientId;
            options.ClientSecret = clientSecret;
            options.CallbackPath = CallbackPath;
            // Identity's short-lived external cookie holds the Google login until the app signs the person in
            options.SignInScheme = IdentityConstants.ExternalScheme;
            options.ClaimActions.MapJsonKey(ExternalClaims.EmailVerified, "email_verified");

            options.Events.OnAccessDenied = context =>
            {
                context.Response.Redirect(CancelledPath);
                context.HandleResponse();
                return Task.CompletedTask;
            };
            options.Events.OnRemoteFailure = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger(typeof(GoogleSignIn));
                LogCallbackFailed(logger, context.Failure);
                context.Response.Redirect(FailedPath);
                context.HandleResponse();
                return Task.CompletedTask;
            };
        });
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Google sign-in failed at the callback")]
    private static partial void LogCallbackFailed(ILogger logger, Exception? exception);
}
