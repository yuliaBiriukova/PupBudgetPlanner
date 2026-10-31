using System.Net;
using System.Text;
using System.Text.Json;
using PupBudgetPlanner.Infrastructure.ExchangeRates;

namespace PupBudgetPlanner.Infrastructure.Tests.ExchangeRates;

public sealed class NbuClientTests
{
    private static readonly DateOnly Day = new(2026, 10, 31);

    /// <summary>Answers every request with the same response and keeps the address asked for.</summary>
    private sealed class Answer(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public Uri? Asked { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Asked = request.RequestUri;
            return Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            });
        }
    }

    private static NbuClient ClientFor(Answer answer) =>
        new(new HttpClient(answer) { BaseAddress = new Uri("https://bank.gov.ua/") });

    // The NBU's own shape (checked on 2026-10-31), names in Ukrainian
    private const string October31 = """
        [
        { "r030":840,"txt":"Долар США","rate":41.3523,"cc":"USD","exchangedate":"31.10.2026","special":null },
        { "r030":978,"txt":"Євро","rate":48.1012,"cc":"EUR","exchangedate":"31.10.2026","special":null },
        { "r030":392,"txt":"Єна","rate":0.27118,"cc":"JPY","exchangedate":"31.10.2026","special":null },
        { "r030":960,"txt":"СПЗ","rate":56.9,"cc":"XDR","exchangedate":"31.10.2026","special":null },
        { "r030":959,"txt":"Золото","rate":170000.1,"cc":"XAU","exchangedate":"31.10.2026","special":null }
        ]
        """;

    [Fact]
    public async Task It_asks_for_the_whole_day_and_keeps_the_currencies_an_account_can_be_in()
    {
        var answer = new Answer(HttpStatusCode.OK, October31);

        var rates = await ClientFor(answer).RatesOnAsync(Day, CancellationToken.None);

        answer.Asked.Should().Be(new Uri("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=20261031&json"));
        // SDR and gold aren't currencies an account can be in
        rates.Should().Equal(new NbuRate("USD", 41.3523m), new NbuRate("EUR", 48.1012m), new NbuRate("JPY", 0.27118m));
    }

    [Fact]
    public async Task A_day_not_published_yet_has_no_rates()
    {
        var rates = await ClientFor(new Answer(HttpStatusCode.OK, "[\n]")).RatesOnAsync(Day, CancellationToken.None);

        rates.Should().BeEmpty();
    }

    [Fact]
    public async Task Rates_of_another_day_are_not_taken_for_the_asked_one()
    {
        var answer = new Answer(HttpStatusCode.OK, October31.Replace("31.10.2026", "30.10.2026", StringComparison.Ordinal));

        (await ClientFor(answer).RatesOnAsync(Day, CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task An_error_from_the_nbu_throws()
    {
        var client = ClientFor(new Answer(HttpStatusCode.ServiceUnavailable, "down"));

        await client.Invoking(c => c.RatesOnAsync(Day, CancellationToken.None))
            .Should().ThrowAsync<HttpRequestException>();
    }

    [Fact]
    public async Task Something_other_than_the_list_throws()
    {
        var client = ClientFor(new Answer(HttpStatusCode.OK, "<html>maintenance</html>"));

        await client.Invoking(c => c.RatesOnAsync(Day, CancellationToken.None)).Should().ThrowAsync<JsonException>();
    }
}
