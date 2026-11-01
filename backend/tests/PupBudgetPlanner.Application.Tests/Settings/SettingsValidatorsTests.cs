using PupBudgetPlanner.Application.Settings;

namespace PupBudgetPlanner.Application.Tests.Settings;

public sealed class ChangeNameRequestValidatorTests
{
    private readonly ChangeNameRequestValidator validator = new();

    [Fact]
    public void Accepts_a_name()
    {
        validator.Validate(new ChangeNameRequest("Olena")).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Needs_a_name(string name)
    {
        var result = validator.Validate(new ChangeNameRequest(name));

        result.Errors.Should().ContainSingle(e => e.PropertyName == "DisplayName")
            .Which.ErrorMessage.Should().Be("Enter your name.");
    }

    [Fact]
    public void Takes_at_most_50_characters_not_counting_spaces_around_them()
    {
        validator.Validate(new ChangeNameRequest($"  {new string('a', 50)}  ")).IsValid.Should().BeTrue();

        validator.Validate(new ChangeNameRequest(new string('a', 51))).Errors
            .Should().ContainSingle().Which.ErrorMessage.Should().Be("Use at most 50 characters.");
    }
}

public sealed class ChangeReportCurrencyRequestValidatorTests
{
    private readonly ChangeReportCurrencyRequestValidator validator = new();

    [Theory]
    [InlineData("UAH")]
    [InlineData("USD")]
    [InlineData("EUR")]
    [InlineData("PLN")]
    public void Accepts_any_currency_an_account_can_be_in(string currency)
    {
        validator.Validate(new ChangeReportCurrencyRequest(currency)).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("usd")]
    [InlineData("RUB")]
    [InlineData("BTC")]
    public void Refuses_anything_else(string currency)
    {
        validator.Validate(new ChangeReportCurrencyRequest(currency)).Errors
            .Should().ContainSingle().Which.ErrorMessage.Should().Be("Pick a currency from the list.");
    }
}
