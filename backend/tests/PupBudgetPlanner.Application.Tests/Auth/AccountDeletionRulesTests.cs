using FluentValidation.TestHelper;
using PupBudgetPlanner.Application.Auth;

namespace PupBudgetPlanner.Application.Tests.Auth;

/// <summary>The confirmation before deleting one's own account (F-027).</summary>
public sealed class AccountDeletionRulesTests
{
    private static DeleteMyAccountRequest Request(string word = "DELETE", string? password = "pup-budget") =>
        new(word, password, null);

    [Theory]
    [InlineData("DELETE")]
    [InlineData("delete")]
    [InlineData("  Delete ")]
    public void The_word_counts_in_any_letter_case(string typed) =>
        AccountDeletionRules.IsWord(typed).Should().BeTrue();

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("DELET")]
    [InlineData("DELETE ME")]
    public void Anything_else_is_not_the_word(string? typed) =>
        AccountDeletionRules.IsWord(typed).Should().BeFalse();

    [Fact]
    public void The_admin_is_refused_before_anything_else()
    {
        AccountDeletionRules.Refusal(isAdmin: true, hasPassword: true, Request(word: "no"), googleConfirmed: false)
            .Should().Be(DeleteMyAccountOutcome.IsAdmin);
    }

    [Fact]
    public void A_wrong_word_is_refused()
    {
        AccountDeletionRules.Refusal(isAdmin: false, hasPassword: true, Request(word: "remove"), googleConfirmed: false)
            .Should().Be(DeleteMyAccountOutcome.WrongWord);
    }

    [Fact]
    public void Someone_with_a_password_must_type_it()
    {
        AccountDeletionRules.Refusal(isAdmin: false, hasPassword: true, Request(password: ""), googleConfirmed: true)
            .Should().Be(DeleteMyAccountOutcome.PasswordNeeded);
    }

    [Fact]
    public void Someone_with_a_password_goes_on_to_the_password_check()
    {
        AccountDeletionRules.Refusal(isAdmin: false, hasPassword: true, Request(), googleConfirmed: false)
            .Should().BeNull();
    }

    [Fact]
    public void Someone_with_only_Google_must_sign_in_with_it_again()
    {
        AccountDeletionRules.Refusal(isAdmin: false, hasPassword: false, Request(password: null), googleConfirmed: false)
            .Should().Be(DeleteMyAccountOutcome.GoogleNotConfirmed);
        AccountDeletionRules.Refusal(isAdmin: false, hasPassword: false, Request(password: null), googleConfirmed: true)
            .Should().BeNull();
    }

    [Fact]
    public void The_validator_asks_for_the_word()
    {
        var validator = new DeleteMyAccountRequestValidator();

        validator.TestValidate(Request(word: "yes")).ShouldHaveValidationErrorFor(r => r.Word)
            .WithErrorMessage("Type DELETE to confirm.");
        validator.TestValidate(Request()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void The_validator_refuses_an_absurdly_long_password()
    {
        new DeleteMyAccountRequestValidator().TestValidate(Request(password: new string('x', 129)))
            .ShouldHaveValidationErrorFor(r => r.Password);
    }
}
