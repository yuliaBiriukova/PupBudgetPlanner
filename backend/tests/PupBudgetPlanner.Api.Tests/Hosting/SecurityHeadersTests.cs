using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using PupBudgetPlanner.Api.Hosting;

namespace PupBudgetPlanner.Api.Tests.Hosting;

public sealed class SecurityHeadersTests
{
    [Fact]
    public async Task Every_response_forbids_frames_sniffing_and_full_referrers()
    {
        var (context, response) = NewContext();

        SecurityHeaders.AddTo(context.Response);
        await response.StartAsync();

        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("DENY");
        context.Response.Headers["Content-Security-Policy"].ToString().Should().Be("frame-ancestors 'none'");
        context.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
        context.Response.Headers["Referrer-Policy"].ToString().Should().Be("strict-origin-when-cross-origin");
    }

    [Fact]
    public async Task The_headers_survive_the_exception_handler_clearing_the_response()
    {
        var (context, response) = NewContext();

        SecurityHeaders.AddTo(context.Response);
        // What the exception handler does before it writes its error
        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await response.StartAsync();

        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("DENY");
        context.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
    }

    private static (DefaultHttpContext Context, StartingResponse Response) NewContext()
    {
        var response = new StartingResponse();
        var features = new FeatureCollection();
        features.Set<IHttpRequestFeature>(new HttpRequestFeature());
        features.Set<IHttpResponseFeature>(response);
        features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(Stream.Null));
        return (new DefaultHttpContext(features), response);
    }

    /// <summary>A response that runs its OnStarting callbacks when told to, as the server does when it starts sending.</summary>
    private sealed class StartingResponse : HttpResponseFeature
    {
        private readonly List<(Func<object, Task> Callback, object State)> _callbacks = [];

        public override void OnStarting(Func<object, Task> callback, object state) => _callbacks.Add((callback, state));

        public async Task StartAsync()
        {
            // The server runs them last registered first
            for (var i = _callbacks.Count - 1; i >= 0; i--)
            {
                await _callbacks[i].Callback(_callbacks[i].State);
            }
        }
    }
}
