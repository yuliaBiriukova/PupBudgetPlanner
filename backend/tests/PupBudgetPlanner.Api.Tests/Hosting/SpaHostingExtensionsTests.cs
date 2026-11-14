using Microsoft.AspNetCore.Http;
using PupBudgetPlanner.Api.Hosting;

namespace PupBudgetPlanner.Api.Tests.Hosting;

public sealed class SpaHostingExtensionsTests
{
    [Theory]
    [InlineData("/assets/index-B7x9kQ2a.js")]
    [InlineData("/assets/index-Cq1mZ0pL.css")]
    [InlineData("/ASSETS/logo-D4e5f6g7.svg")]
    public void Hashed_assets_are_cached_for_a_year(string path)
    {
        SpaHostingExtensions.CacheControlFor(new PathString(path))
            .Should().Be(SpaHostingExtensions.ImmutableCacheControl);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/index.html")]
    [InlineData("/favicon.svg")]
    [InlineData("/assets-old/app.js")]
    [InlineData("/reports/2026")]
    [InlineData("/sw.js")]
    [InlineData("/workbox-5b385ed2.js")]
    [InlineData("/manifest.webmanifest")]
    [InlineData("/pwa-maskable-512.png")]
    public void Other_files_are_revalidated_so_a_release_shows_up_at_once(string path)
    {
        SpaHostingExtensions.CacheControlFor(new PathString(path))
            .Should().Be(SpaHostingExtensions.RevalidateCacheControl);
    }

    [Theory]
    [InlineData("manifest.webmanifest", "application/manifest+json")]
    [InlineData("sw.js", "text/javascript")]
    [InlineData("pwa-512.png", "image/png")]
    public void The_installable_apps_files_have_their_content_types(string file, string contentType)
    {
        SpaHostingExtensions.ContentTypes.TryGetContentType(file, out var actual).Should().BeTrue();
        actual.Should().Be(contentType);
    }
}
