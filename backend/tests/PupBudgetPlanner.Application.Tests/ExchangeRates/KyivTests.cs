using PupBudgetPlanner.Application.ExchangeRates;

namespace PupBudgetPlanner.Application.Tests.ExchangeRates;

public sealed class KyivTests
{
    private sealed class At(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    [Theory]
    // Winter, UTC+2: 22:30 UTC is already the next day in Kyiv
    [InlineData("2026-10-31T21:59:00Z", "2026-10-31")]
    [InlineData("2026-10-31T22:30:00Z", "2026-11-01")]
    // Summer, UTC+3
    [InlineData("2026-07-01T20:59:00Z", "2026-07-01")]
    [InlineData("2026-07-01T21:00:00Z", "2026-07-02")]
    public void Today_is_the_date_in_kyiv_not_the_servers(string utc, string kyiv)
    {
        Kyiv.Today(new At(DateTimeOffset.Parse(utc, System.Globalization.CultureInfo.InvariantCulture)))
            .Should().Be(DateOnly.Parse(kyiv, System.Globalization.CultureInfo.InvariantCulture));
    }
}
