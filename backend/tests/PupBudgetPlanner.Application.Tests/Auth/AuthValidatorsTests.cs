using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Application.Tests.Auth;

public sealed class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator validator = new();

    private static RegisterRequest Valid() => new("Olena", "olena@example.com", "kyiv-budget-26");

    [Fact]
    public void Accepts_a_name_an_email_and_a_long_enough_password()
    {
        validator.Validate(Valid()).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Needs_a_name(string name)
    {
        var result = validator.Validate(Valid() with { DisplayName = name });

        result.Errors.Should().ContainSingle(e => e.PropertyName == "DisplayName")
            .Which.ErrorMessage.Should().Be("Enter your name.");
    }

    [Fact]
    public void Keeps_the_name_within_the_column_length()
    {
        var result = validator.Validate(Valid() with { DisplayName = new string('a', AuthLimits.DisplayNameMaxLength + 1) });

        result.Errors.Should().ContainSingle(e => e.PropertyName == "DisplayName");
    }

    [Theory]
    [InlineData("", "Enter your email.")]
    [InlineData("olena", "Enter an email like name@example.com.")]
    public void Needs_an_email(string email, string message)
    {
        var result = validator.Validate(Valid() with { Email = email });

        result.Errors.Should().ContainSingle(e => e.PropertyName == "Email")
            .Which.ErrorMessage.Should().Be(message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("1234567")]
    public void Needs_at_least_eight_characters_of_password(string password)
    {
        var result = validator.Validate(Valid() with { Password = password });

        result.Errors.Should().ContainSingle(e => e.PropertyName == "Password")
            .Which.ErrorMessage.Should().Be("Use at least 8 characters.");
    }

    [Fact]
    public void Asks_for_length_only_not_digits_or_symbols()
    {
        validator.Validate(Valid() with { Password = "abcdefgh" }).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Limits_the_password_length()
    {
        var result = validator.Validate(Valid() with { Password = new string('a', AuthLimits.PasswordMaxLength + 1) });

        result.Errors.Should().ContainSingle(e => e.PropertyName == "Password");
    }
}

public sealed class SignInRequestValidatorTests
{
    private readonly SignInRequestValidator validator = new();

    [Fact]
    public void Accepts_an_email_and_a_password()
    {
        validator.Validate(new SignInRequest("olena@example.com", "x")).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Needs_an_email_and_a_password()
    {
        var result = validator.Validate(new SignInRequest("", ""));

        result.Errors.Select(e => e.ErrorMessage).Should().BeEquivalentTo("Enter your email.", "Enter your password.");
    }
}
