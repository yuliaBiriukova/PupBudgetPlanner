using System.Globalization;
using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Transactions;

public sealed class TransactionValidatorTests
{
    /// <summary>1 Nov 2026, 00:30 in Kyiv (22:30 UTC the day before).</summary>
    private sealed class JustAfterMidnightInKyiv : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 10, 31, 22, 30, 0, TimeSpan.Zero);
    }

    private static readonly SaveTransactionRequestValidator Validator = new(new JustAfterMidnightInKyiv());

    private static SaveTransactionRequest Valid() => new(
        TransactionType.Expense, new DateOnly(2026, 11, 1), Guid.CreateVersion7(), Guid.CreateVersion7(), 612m, "Silpo");

    private static IEnumerable<string> Errors(SaveTransactionRequest request) =>
        Validator.Validate(request).Errors.Select(error => error.ErrorMessage);

    [Fact]
    public void A_filled_in_form_is_valid()
    {
        Validator.Validate(Valid()).IsValid.Should().BeTrue();
        Validator.Validate(Valid() with { Type = TransactionType.Income, Note = null }).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Today_is_kyivs_and_a_day_after_it_is_refused()
    {
        Validator.Validate(Valid() with { Date = new DateOnly(2026, 10, 1) }).IsValid.Should().BeTrue();
        Errors(Valid() with { Date = new DateOnly(2026, 11, 2) }).Should().Equal("Pick today or a day before it.");
    }

    [Theory]
    [InlineData("0")]
    [InlineData("0.4")]
    [InlineData("-250")]
    public void The_amount_is_more_than_zero_once_rounded(string amount)
    {
        Errors(Valid() with { Amount = decimal.Parse(amount, CultureInfo.InvariantCulture) })
            .Should().Equal("The amount must be more than zero.");
    }

    [Fact]
    public void The_amount_fits_the_column()
    {
        Errors(Valid() with { Amount = 10_000_000_000_000_000m }).Should().Equal("The amount is too big.");
    }

    [Fact]
    public void The_account_and_the_category_are_picked()
    {
        Errors(Valid() with { AccountId = Guid.Empty, CategoryId = Guid.Empty })
            .Should().Equal("Pick an account.", "Pick a category.");
    }

    [Fact]
    public void The_note_is_short()
    {
        Validator.Validate(Valid() with { Note = $"  {new string('a', Transaction.NoteMaxLength)}  " })
            .IsValid.Should().BeTrue();
        Errors(Valid() with { Note = new string('a', Transaction.NoteMaxLength + 1) })
            .Should().Equal($"Use at most {Transaction.NoteMaxLength} characters.");
    }

    [Fact]
    public void An_unknown_type_is_refused()
    {
        Errors(Valid() with { Type = (TransactionType)7 }).Should().Equal("Pick expense, income or transfer.");
    }

    private static SaveTransactionRequest Transfer() => new(
        TransactionType.Transfer, new DateOnly(2026, 11, 1), Guid.CreateVersion7(), null, 100m, null,
        Guid.CreateVersion7(), 4_490m);

    [Fact]
    public void A_transfer_goes_to_another_account_with_no_category()
    {
        Validator.Validate(Transfer()).IsValid.Should().BeTrue();
        // Between accounts in one currency the To amount isn't sent: it is the amount itself
        Validator.Validate(Transfer() with { ToAmount = null }).IsValid.Should().BeTrue();

        Errors(Transfer() with { ToAccountId = null }).Should().Equal("Pick the account the money goes to.");
        var from = Guid.CreateVersion7();
        Errors(Transfer() with { AccountId = from, ToAccountId = from })
            .Should().Equal("Pick another account to move the money to.");
        Errors(Transfer() with { CategoryId = Guid.CreateVersion7() }).Should().Equal("A transfer has no category.");
    }

    [Theory]
    [InlineData("0", "The amount must be more than zero.")]
    [InlineData("-10", "The amount must be more than zero.")]
    [InlineData("10000000000000000", "The amount is too big.")]
    public void What_the_to_account_got_is_an_amount_like_any_other(string amount, string error)
    {
        var request = Transfer() with { ToAmount = decimal.Parse(amount, CultureInfo.InvariantCulture) };

        var failure = Validator.Validate(request).Errors.Should().ContainSingle().Subject;
        failure.PropertyName.Should().Be(nameof(SaveTransactionRequest.ToAmount));
        failure.ErrorMessage.Should().Be(error);
    }

    [Fact]
    public void Only_a_transfer_goes_to_another_account()
    {
        Errors(Valid() with { ToAccountId = Guid.CreateVersion7(), ToAmount = 100m })
            .Should().Equal("Only a transfer goes to another account.", "Only a transfer goes to another account.");
    }
}
