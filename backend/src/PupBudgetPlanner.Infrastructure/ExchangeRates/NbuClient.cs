using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Infrastructure.ExchangeRates;

/// <summary>Where the NBU's open API is. The E2E run in CI points it at a stub with fixed rates.</summary>
public sealed class NbuOptions
{
    public const string SectionName = "Nbu";

    public Uri BaseAddress { get; set; } = new("https://bank.gov.ua/");

    /// <summary>The NBU answers in well under a second; longer means it's in trouble.</summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(10);
}

/// <summary>The NBU's official rate of one currency: hryvnias for one unit.</summary>
internal sealed record NbuRate(string Currency, decimal RateToUah);

/// <summary>The NBU's open API (F-017); I-013 will ask it for banks too.</summary>
internal interface INbuClient
{
    /// <summary>
    /// The rates the NBU set for <paramref name="date"/>, of the currencies an account can be in; empty when the day
    /// isn't published yet. Throws when the NBU can't be reached or answers with something else.
    /// </summary>
    Task<IReadOnlyList<NbuRate>> RatesOnAsync(DateOnly date, CancellationToken cancellationToken);
}

internal sealed class NbuClient(HttpClient http) : INbuClient
{
    public async Task<IReadOnlyList<NbuRate>> RatesOnAsync(DateOnly date, CancellationToken cancellationToken)
    {
        // Every currency of the day in one list; `date` is yyyyMMdd, `exchangedate` comes back as dd.MM.yyyy
        var uri = $"NBUStatService/v1/statdirectory/exchange?date={date.ToString("yyyyMMdd", CultureInfo.InvariantCulture)}&json";
        var entries = await http.GetFromJsonAsync<List<Entry>>(uri, cancellationToken)
            ?? throw new HttpRequestException("The NBU answered with nothing.");
        var day = date.ToString("dd.MM.yyyy", CultureInfo.InvariantCulture);

        return entries
            .Where(entry => entry.Code is { } code && code != Currencies.Hryvnia && Currencies.IsKnown(code)
                && entry.Date == day && entry.Rate > 0)
            .Select(entry => new NbuRate(entry.Code!, entry.Rate))
            .DistinctBy(rate => rate.Currency)
            .ToList();
    }

    private sealed record Entry(
        [property: JsonPropertyName("cc")] string? Code,
        [property: JsonPropertyName("rate")] decimal Rate,
        [property: JsonPropertyName("exchangedate")] string? Date);
}
