using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Transactions;

/// <summary>A transfer with a hidden account, as the rest of the family sees it (F-030, "A private account").</summary>
public sealed class PrivateSidesTests
{
    private static readonly Guid Olena = Guid.CreateVersion7();
    private static readonly Guid Andriy = Guid.CreateVersion7();
    private static readonly Guid Card = Guid.CreateVersion7();
    private static readonly Guid Dollars = Guid.CreateVersion7();

    private static readonly KeptFromFamily DollarsHidden =
        KeptFromFamily.For(Olena, [new KeptAccount(Dollars, Andriy, AccountShare.Hidden)], [], []);

    /// <summary>4 100 hryvnias off his card bought 100 dollars for the box.</summary>
    private static TransactionItem Exchange(
        Guid from, string fromCurrency, decimal amount, Guid to, string toCurrency, decimal toAmount) =>
        new(
            Guid.CreateVersion7(),
            Andriy,
            TransactionType.Transfer,
            new DateOnly(2026, 11, 12),
            from,
            from == Card ? "Mono" : "Dollars in the box",
            fromCurrency,
            null,
            null,
            amount,
            "For the trip",
            to,
            to == Card ? "Mono" : "Dollars in the box",
            toCurrency,
            toAmount);

    [Fact]
    public void Into_a_hidden_account_shows_what_left_the_shown_one()
    {
        var seen = Exchange(Card, "UAH", 4_100m, Dollars, "USD", 100m).SeenWith(DollarsHidden);

        seen.AccountId.Should().Be(Card);
        seen.ToAccountId.Should().Be(PrivateSides.PrivateAccountId);
        seen.ToAccountName.Should().BeEmpty();
        seen.ToCurrency.Should().Be("UAH");
        seen.ToAmount.Should().Be(4_100m);
        seen.Note.Should().Be("For the trip");
    }

    [Fact]
    public void Out_of_a_hidden_account_shows_what_came_into_the_shown_one()
    {
        var seen = Exchange(Dollars, "USD", 100m, Card, "UAH", 4_100m).SeenWith(DollarsHidden);

        seen.AccountId.Should().Be(PrivateSides.PrivateAccountId);
        seen.AccountName.Should().BeEmpty();
        seen.Currency.Should().Be("UAH");
        seen.Amount.Should().Be(4_100m);
        seen.ToAccountId.Should().Be(Card);
    }

    [Fact]
    public void A_transfer_between_shown_accounts_and_your_own_stay_as_they_are()
    {
        var shown = Exchange(Card, "UAH", 4_100m, Dollars, "USD", 100m);

        shown.SeenWith(KeptFromFamily.Nothing).Should().BeSameAs(shown);
        shown.SeenWith(KeptFromFamily.For(Olena, [], [], [])).Should().BeSameAs(shown);
    }
}
