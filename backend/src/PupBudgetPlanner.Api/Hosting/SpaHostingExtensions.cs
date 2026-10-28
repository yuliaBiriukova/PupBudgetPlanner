using Microsoft.Net.Http.Headers;

namespace PupBudgetPlanner.Api.Hosting;

/// <summary>
/// Serves the React build from <c>wwwroot</c> (the Dockerfile copies it there) on the same origin as the API.
/// Locally there is no <c>wwwroot</c>: the Vite dev server serves the app and proxies <c>/api</c>.
/// </summary>
public static class SpaHostingExtensions
{
    /// <summary>Vite puts the bundles here with a content hash in the file name.</summary>
    public const string HashedAssetsPath = "/assets";

    public const string ImmutableCacheControl = "public, max-age=31536000, immutable";

    /// <summary><c>index.html</c> and other unhashed files: the browser revalidates them, so a release shows up at once.</summary>
    public const string RevalidateCacheControl = "no-cache";

    private const string IndexFile = "index.html";

    private static readonly StaticFileOptions StaticFileOptions = new()
    {
        OnPrepareResponse = context =>
            context.Context.Response.Headers[HeaderNames.CacheControl] = CacheControlFor(context.Context.Request.Path),
    };

    public static string CacheControlFor(PathString path) =>
        path.StartsWithSegments(HashedAssetsPath, StringComparison.OrdinalIgnoreCase)
            ? ImmutableCacheControl
            : RevalidateCacheControl;

    public static WebApplication UseSpaStaticFiles(this WebApplication app)
    {
        app.UseStaticFiles(StaticFileOptions);
        return app;
    }

    /// <summary>
    /// Client-side routes get <c>index.html</c>; unknown <c>/api</c> routes stay API 404s
    /// (turned into ProblemDetails by the status code pages). Both are open without signing in: the app shows
    /// its own sign-in page, and a missing API route is a 404 for everyone.
    /// </summary>
    public static WebApplication MapSpaFallback(this WebApplication app)
    {
        app.MapFallback("api/{**path}", context =>
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        }).AllowAnonymous();
        app.MapFallbackToFile(IndexFile, StaticFileOptions).AllowAnonymous();
        return app;
    }
}
