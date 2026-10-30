using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.Tests.Accounts;

public sealed class AccountValidatorTests
{
    private static readonly SaveAccountRequestValidator Validator = new();

    private static SaveAccountRequest Valid() => new(
        "Mono black", "UAH", SourceKind.Bank, null, "Monobank", 21_500m, new DateOnly(2026, 1, 1), CardStyle.Solid);

    private static IEnumerable<string> Errors(SaveAccountRequest request) =>
        Validator.Validate(request).Errors.Select(error => error.ErrorMessage);

    [Fact]
    public void A_filled_in_form_is_valid()
    {
        Validator.Validate(Valid()).IsValid.Should().BeTrue();
        Validator.Validate(Valid() with { Source = SourceKind.Cash, BankName = null }).IsValid.Should().BeTrue();
        Validator.Validate(Valid() with { Source = SourceKind.Own, SourceName = "Deposit", BankName = null })
            .IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void The_account_needs_a_name(string? name)
    {
        Errors(Valid() with { Name = name! }).Should().Equal("Give the account a name.");
    }

    [Fact]
    public void The_name_is_short()
    {
        Errors(Valid() with { Name = new string('a', Account.NameMaxLength + 1) })
            .Should().Equal($"Use at most {Account.NameMaxLength} characters.");
    }

    [Theory]
    [InlineData("XYZ")]
    [InlineData("usd")]
    [InlineData("")]
    public void The_currency_is_one_from_the_list(string currency)
    {
        Errors(Valid() with { Currency = currency }).Should().Equal("Pick a currency from the list.");
    }

    [Fact]
    public void A_bank_account_needs_its_bank()
    {
        Errors(Valid() with { BankName = " " }).Should().Equal("Pick your bank or type its name.");
    }

    [Fact]
    public void An_own_source_needs_its_name()
    {
        Errors(Valid() with { Source = SourceKind.Own, SourceName = null }).Should().Equal("Name the new source.");
    }

    [Theory]
    [InlineData("1240.50", true)]
    [InlineData("-300", true)]
    [InlineData("0", true)]
    [InlineData("1240.505", true)]
    [InlineData("9999999999999999.49", true)]
    [InlineData("9999999999999999.5", false)]
    [InlineData("10000000000000000", false)]
    public void Any_opening_balance_in_range_is_fine_cents_are_rounded_when_saved(string amount, bool valid)
    {
        var request = Valid() with { OpeningBalance = decimal.Parse(amount, System.Globalization.CultureInfo.InvariantCulture) };

        Validator.Validate(request).IsValid.Should().Be(valid);
    }
}
