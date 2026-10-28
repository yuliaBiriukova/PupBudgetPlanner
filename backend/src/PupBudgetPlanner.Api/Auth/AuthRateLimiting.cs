using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>How many sign-in and sign-up attempts one IP address may make per window (ADR 0012).</summary>
public sealed class AuthRateLimitOptions
{
    public const string Section = "RateLimiting:Auth";

    /// <summary>Room for a family on one home connection mistyping a few times, not for checking emails in bulk.</summary>
    public int PermitLimit { get; set; } = 10;

    public TimeSpan Window { get; set; } = TimeSpan.FromMinutes(1);
}

public static class AuthRateLimiting
{
    public const string PolicyName = "auth";

    /// <summary>One fixed window per client IP (the real one: forwarded headers run first).</summary>
    public static RateLimitPartition<string> Partition(HttpContext context, AuthRateLimitOptions options) =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = options.PermitLimit,
                Window = options.Window,
                QueueLimit = 0,
            });

    public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthRateLimitOptions>(configuration.GetSection(AuthRateLimitOptions.Section));

        services.AddRateLimiter(options =>
        {
            options.AddPolicy(PolicyName, context =>
                Partition(context, context.RequestServices.GetRequiredService<IOptions<AuthRateLimitOptions>>().Value));

            options.OnRejected = (rejected, _) =>
            {
                var http = rejected.HttpContext;
                http.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                return http.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = http,
                    ProblemDetails = new ProblemDetails
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Too many attempts. Wait a minute and try again.",
                    },
                });
            };
        });

        return services;
    }
}
