using System.Globalization;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Domain.Tests.Transactions;

public sealed class TransactionTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 1, 9, 0, 0, TimeSpan.Zero);

    private static decimal Amount(string text) => decimal.Parse(text, CultureInfo.InvariantCulture);

    internal static TransactionDetails Details(
        TransactionType type = TransactionType.Expense,
        decimal amount = 612m,
        string? note = "Silpo",
        Guid? accountId = null) =>
        new(type, new DateOnly(2026, 11, 1), accountId ?? Guid.CreateVersion7(), Guid.CreateVersion7(), amount, note);

    [Fact]
    public void A_new_transaction_takes_the_form()
    {
        var details = Details();

        var transaction = Transaction.Create(Guid.CreateVersion7(), details, Now);

        transaction.Type.Should().Be(TransactionType.Expense);
        transaction.Date.Should().Be(details.Date);
        transaction.AccountId.Should().Be(details.AccountId);
        transaction.CategoryId.Should().Be(details.CategoryId);
        transaction.Amount.Should().Be(612m);
        transaction.Note.Should().Be("Silpo");
        transaction.CreatedAt.Should().Be(Now);
        transaction.UpdatedAt.Should().BeNull();
    }

    [Theory]
    [InlineData("250.50", "251")]
    [InlineData("250.49", "250")]
    [InlineData("0.5", "1")]
    public void The_amount_is_whole(string typed, string saved)
    {
        var transaction = Transaction.Create(Guid.CreateVersion7(), Details(amount: Amount(typed)), Now);

        transaction.Amount.Should().Be(Amount(saved));
    }

    [Theory]
    [InlineData("0")]
    [InlineData("0.49")]
    [InlineData("-100")]
    public void The_amount_is_more_than_zero(string typed)
    {
        var create = () => Transaction.Create(Guid.CreateVersion7(), Details(amount: Amount(typed)), Now);

        create.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("  Lunch with Vlad ", "Lunch with Vlad")]
    [InlineData("   ", null)]
    [InlineData(null, null)]
    public void The_note_is_trimmed_and_a_blank_one_is_none(string? typed, string? saved)
    {
        var transaction = Transaction.Create(Guid.CreateVersion7(), Details(note: typed), Now);

        transaction.Note.Should().Be(saved);
    }

    [Fact]
    public void A_change_takes_the_form_and_says_when()
    {
        var transaction = Transaction.Create(Guid.CreateVersion7(), Details(), Now);
        var later = Now.AddHours(2);

        transaction.Update(Details(type: TransactionType.Income, amount: 1_500m, note: null), later);

        transaction.Type.Should().Be(TransactionType.Income);
        transaction.Amount.Should().Be(1_500m);
        transaction.Note.Should().BeNull();
        transaction.CreatedAt.Should().Be(Now);
        transaction.UpdatedAt.Should().Be(later);
    }

    [Fact]
    public void An_expense_takes_money_away_and_an_income_adds_it()
    {
        Transaction.Create(Guid.CreateVersion7(), Details(TransactionType.Expense, 612m), Now)
            .Movement.Should().Be(-612m);
        Transaction.Create(Guid.CreateVersion7(), Details(TransactionType.Income, 1_500m), Now)
            .Movement.Should().Be(1_500m);
    }

    [Fact]
    public void Each_type_takes_categories_of_its_own_kind()
    {
        Transaction.CategoryKindOf(TransactionType.Expense).Should().Be(CategoryKind.Expense);
        Transaction.CategoryKindOf(TransactionType.Income).Should().Be(CategoryKind.Income);
    }

    private static readonly Guid Dollars = Guid.CreateVersion7();
    private static readonly Guid Card = Guid.CreateVersion7();

    private static TransactionDetails Transfer(decimal amount = 100m, decimal? toAmount = 4_490m) =>
        new(TransactionType.Transfer, new DateOnly(2026, 11, 1), Dollars, null, amount, null, Card, toAmount);

    [Fact]
    public void A_transfer_goes_from_one_account_to_another_with_both_amounts_whole()
    {
        var transaction = Transaction.Create(Guid.CreateVersion7(), Transfer(amount: 100.4m, toAmount: 4_489.5m), Now);

        transaction.Type.Should().Be(TransactionType.Transfer);
        transaction.AccountId.Should().Be(Dollars);
        transaction.ToAccountId.Should().Be(Card);
        transaction.CategoryId.Should().BeNull();
        transaction.Amount.Should().Be(100m);
        transaction.ToAmount.Should().Be(4_490m);
        transaction.Movement.Should().Be(-100m);
    }

    [Fact]
    public void A_transfer_needs_another_account_something_got_and_no_category()
    {
        var owner = Guid.CreateVersion7();

        FluentActions.Invoking(() => Transaction.Create(owner, Transfer() with { ToAccountId = null }, Now))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => Transaction.Create(owner, Transfer() with { ToAccountId = Dollars }, Now))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => Transaction.Create(owner, Transfer(toAmount: null), Now))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => Transaction.Create(owner, Transfer(toAmount: 0.4m), Now))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => Transaction.Create(owner, Transfer() with { CategoryId = Guid.CreateVersion7() }, Now))
            .Should().Throw<ArgumentException>();
    }

    [Fact]
    public void An_expense_needs_a_category_and_goes_to_no_other_account()
    {
        var owner = Guid.CreateVersion7();

        FluentActions.Invoking(() => Transaction.Create(owner, Details() with { CategoryId = null }, Now))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => Transaction.Create(owner, Details() with { ToAccountId = Card, ToAmount = 1m }, Now))
            .Should().Throw<ArgumentException>();
    }

    [Fact]
    public void An_expense_changed_into_a_transfer_takes_the_to_side_and_drops_its_category()
    {
        var transaction = Transaction.Create(Guid.CreateVersion7(), Details(accountId: Dollars), Now);

        transaction.Update(Transfer(), Now.AddHours(1));

        transaction.CategoryId.Should().BeNull();
        transaction.ToAccountId.Should().Be(Card);
        transaction.ToAmount.Should().Be(4_490m);
    }
}
