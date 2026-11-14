using Microsoft.AspNetCore.StaticFiles;
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

    /// <summary>
    /// <c>index.html</c> and other unhashed files: the browser revalidates them, so a release shows up at once. The service
    /// worker (<c>sw.js</c>) and the manifest are among them, so an installed app finds a release (F-025).
    /// </summary>
    public const string RevalidateCacheControl = "no-cache";

    private const string IndexFile = "index.html";

    /// <summary>
    /// The content types of the build's files. The installable app's manifest (F-025) is set here rather than left to
    /// the framework's list, so a browser always reads it as a web app manifest.
    /// </summary>
    public static readonly FileExtensionContentTypeProvider ContentTypes = CreateContentTypes();

    private static FileExtensionContentTypeProvider CreateContentTypes()
    {
        var provider = new FileExtensionContentTypeProvider();
        provider.Mappings[".webmanifest"] = "application/manifest+json";
        return provider;
    }

    private static readonly StaticFileOptions StaticFileOptions = new()
    {
        ContentTypeProvider = ContentTypes,
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
