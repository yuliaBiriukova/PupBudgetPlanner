using Microsoft.Net.Http.Headers;

namespace PupBudgetPlanner.Api.Hosting;

/// <summary>
/// Headers on every response, the app's pages and the API's alike (F-026): no other site may show the app in a frame,
/// the browser keeps to the content types it is given, and other sites see only the origin the person came from.
/// A full Content-Security-Policy waits until after the MVP (Google sign-in and the service worker need care); the one
/// sent here only forbids the frames.
/// </summary>
public static class SecurityHeaders
{
    public static readonly IReadOnlyDictionary<string, string> Values = new Dictionary<string, string>
    {
        [HeaderNames.XContentTypeOptions] = "nosniff",
        [HeaderNames.XFrameOptions] = "DENY",
        [HeaderNames.ContentSecurityPolicy] = "frame-ancestors 'none'",
        ["Referrer-Policy"] = "strict-origin-when-cross-origin",
    };

    public static WebApplication UseSecurityHeaders(this WebApplication app)
    {
        app.Use((context, next) =>
        {
            AddTo(context.Response);
            return next(context);
        });
        return app;
    }

    /// <summary>
    /// Set as the response starts, not now: the exception handler clears the headers before it writes its error, and
    /// the error must carry them too.
    /// </summary>
    public static void AddTo(HttpResponse response) =>
        response.OnStarting(() =>
        {
            foreach (var (name, value) in Values)
            {
                response.Headers[name] = value;
            }

            return Task.CompletedTask;
        });
}
