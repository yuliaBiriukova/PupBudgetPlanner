using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using PupBudgetPlanner.Api.Auth;

namespace PupBudgetPlanner.Api.Tests.Auth;

public sealed class AuthRateLimitingTests
{
    private static DefaultHttpContext From(string ip) =>
        new DefaultHttpContext { Connection = { RemoteIpAddress = IPAddress.Parse(ip) } };

    private static PartitionedRateLimiter<HttpContext> Limiter(int permits) =>
        PartitionedRateLimiter.Create<HttpContext, string>(context =>
            AuthRateLimiting.Partition(context, new AuthRateLimitOptions { PermitLimit = permits, Window = TimeSpan.FromHours(1) }));

    [Fact]
    public void Blocks_an_address_after_its_attempts_run_out()
    {
        using var limiter = Limiter(permits: 3);

        var leases = Enumerable.Range(0, 4).Select(_ => limiter.AttemptAcquire(From("203.0.113.7"))).ToList();

        leases.Select(lease => lease.IsAcquired).Should().Equal(true, true, true, false);
    }

    [Fact]
    public void Counts_each_address_on_its_own()
    {
        using var limiter = Limiter(permits: 1);

        limiter.AttemptAcquire(From("203.0.113.7")).IsAcquired.Should().BeTrue();
        limiter.AttemptAcquire(From("198.51.100.2")).IsAcquired.Should().BeTrue();
        limiter.AttemptAcquire(From("203.0.113.7")).IsAcquired.Should().BeFalse();
    }

    [Fact]
    public void Defaults_allow_ten_attempts_a_minute()
    {
        var options = new AuthRateLimitOptions();

        options.PermitLimit.Should().Be(10);
        options.Window.Should().Be(TimeSpan.FromMinutes(1));
    }
}
