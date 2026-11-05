using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Domain.Tests.Accounts;

public sealed class BalanceSheetTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 30, 9, 0, 0, TimeSpan.Zero);
    private static readonly Guid Owner = Guid.CreateVersion7();

    private static Account New(string currency, decimal opening, SourceKind source = SourceKind.Cash) =>
        Account.Create(Owner, AccountTests.Details(currency: currency, source: source, opening: opening), Now);

    private static readonly IReadOnlyDictionary<Guid, decimal> None = new Dictionary<Guid, decimal>();

    [Fact]
    public void A_balance_is_the_opening_balance_plus_the_movement()
    {
        var wallet = New("UAH", 1_200m);
        var dollars = New("USD", 500m);

        var balances = BalanceSheet.BalancesOf([wallet, dollars], new Dictionary<Guid, decimal> { [wallet.Id] = -340m });

        balances.Select(b => b.Balance).Should().Equal(860m, 500m);
    }

    [Fact]
    public void An_accounts_movement_is_its_incomes_less_its_expenses()
    {
        var wallet = New("UAH", 1_200m);
        var card = New("UAH", 48_211m);

        var movements = BalanceSheet.MovementsOf([
            new TransactionSum(wallet.Id, TransactionType.Expense, 3, 1_032m),
            new TransactionSum(wallet.Id, TransactionType.Income, 1, 500m),
            new TransactionSum(card.Id, TransactionType.Income, 1, 62_000m),
        ]);

        movements.Should().BeEquivalentTo(new Dictionary<Guid, decimal> { [wallet.Id] = -532m, [card.Id] = 62_000m });
        BalanceSheet.BalancesOf([wallet, card], movements).Select(b => b.Balance).Should().Equal(668m, 110_211m);
    }

    [Fact]
    public void A_transfer_takes_its_amount_from_one_account_and_gives_what_the_other_got()
    {
        var dollars = New("USD", 500m);
        var card = New("UAH", 1_000m);

        // $100 sold for 4 490 ₴
        var movements = BalanceSheet.MovementsOf([
            new TransactionSum(dollars.Id, TransactionType.Transfer, 1, 100m),
            new TransactionSum(card.Id, TransactionType.Transfer, 1, 4_490m, Incoming: true),
        ]);

        BalanceSheet.BalancesOf([dollars, card], movements).Select(b => b.Balance).Should().Equal(400m, 5_490m);
    }

    [Fact]
    public void An_account_was_last_used_when_its_latest_transaction_of_any_type_was_added()
    {
        var card = New("UAH", 1_000m);
        var dollars = New("USD", 500m);
        var unused = New("EUR", 0m);

        // An expense and an income on the card, then $100 moved from the dollars to the card
        var lastUsed = BalanceSheet.LastUsedOf([
            new TransactionSum(card.Id, TransactionType.Expense, 3, 1_032m, LastAddedAt: Now.AddDays(-2)),
            new TransactionSum(card.Id, TransactionType.Income, 1, 500m, LastAddedAt: Now.AddDays(-5)),
            new TransactionSum(dollars.Id, TransactionType.Transfer, 1, 100m, LastAddedAt: Now),
            new TransactionSum(card.Id, TransactionType.Transfer, 1, 4_490m, Incoming: true, LastAddedAt: Now),
        ]);

        lastUsed.Should().BeEquivalentTo(new Dictionary<Guid, DateTimeOffset> { [card.Id] = Now, [dollars.Id] = Now });
        lastUsed.Should().NotContainKey(unused.Id);
    }

    [Fact]
    public void Each_currency_has_its_total_and_a_debt_counts_against_it()
    {
        var accounts = new[] { New("UAH", 48_211m), New("UAH", -4_312m), New("USD", 1_240m) };

        var totals = BalanceSheet.TotalsOf(BalanceSheet.BalancesOf(accounts, None));

        totals.Should().Equal(new CurrencyTotal("UAH", 2, 43_899m), new CurrencyTotal("USD", 1, 1_240m));
    }

    [Fact]
    public void Archived_accounts_are_left_out_of_the_totals()
    {
        var kept = New("USD", 500m);
        var archived = New("USD", 12m);
        var euro = New("EUR", 300m);
        archived.Archive(Now);
        euro.Archive(Now);

        var totals = BalanceSheet.TotalsOf(BalanceSheet.BalancesOf([kept, archived, euro], None));

        totals.Should().Equal(new CurrencyTotal("USD", 1, 500m));
    }

    [Fact]
    public void The_hryvnia_comes_first_then_the_currencies_with_most_accounts_then_by_code()
    {
        var accounts = new[]
        {
            New("PLN", 640m), New("USD", 1_240m), New("EUR", 300m), New("USD", 500m), New("UAH", 3_450m),
        };

        var totals = BalanceSheet.TotalsOf(BalanceSheet.BalancesOf(accounts, None));

        totals.Select(t => t.Currency).Should().Equal("UAH", "USD", "EUR", "PLN");
    }

    [Fact]
    public void No_accounts_no_totals()
    {
        BalanceSheet.TotalsOf([]).Should().BeEmpty();
    }
}
