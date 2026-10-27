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
    public void Other_files_are_revalidated_so_a_release_shows_up_at_once(string path)
    {
        SpaHostingExtensions.CacheControlFor(new PathString(path))
            .Should().Be(SpaHostingExtensions.RevalidateCacheControl);
    }
}
