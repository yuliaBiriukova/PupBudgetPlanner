using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Domain.Tests.Accounts;

public sealed class AccountTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 30, 9, 0, 0, TimeSpan.Zero);

    internal static AccountDetails Details(
        string name = "Mono black",
        string currency = "UAH",
        SourceKind source = SourceKind.Bank,
        Guid? sourceId = null,
        Guid? bankId = null,
        decimal opening = 21_500m) =>
        new(
            name,
            currency,
            source,
            source == SourceKind.Own ? sourceId ?? Guid.CreateVersion7() : sourceId,
            source == SourceKind.Bank ? bankId ?? Guid.CreateVersion7() : bankId,
            opening,
            new DateOnly(2026, 1, 1),
            CardStyle.Solid);

    [Fact]
    public void A_new_account_takes_the_form_and_is_in_use()
    {
        var account = Account.Create(Guid.CreateVersion7(), Details(name: "  Mono black "), Now);

        account.Name.Should().Be("Mono black");
        account.Currency.Should().Be("UAH");
        account.OpeningBalance.Should().Be(21_500m);
        account.CreatedAt.Should().Be(Now);
        account.IsArchived.Should().BeFalse();
    }

    [Theory]
    [InlineData("1240.50", "1241")]
    [InlineData("1240.49", "1240")]
    [InlineData("-4312.50", "-4313")]
    [InlineData("-0.40", "0")]
    public void The_opening_balance_is_kept_in_whole_units_half_away_from_zero(string typed, string kept)
    {
        var culture = System.Globalization.CultureInfo.InvariantCulture;

        var account = Account.Create(Guid.CreateVersion7(), Details(opening: decimal.Parse(typed, culture)), Now);

        account.OpeningBalance.Should().Be(decimal.Parse(kept, culture));
    }

    [Fact]
    public void Cash_has_neither_a_source_nor_a_bank()
    {
        var act = () => Account.Create(Guid.CreateVersion7(), Details(source: SourceKind.Cash, bankId: Guid.CreateVersion7()), Now);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void A_bank_account_needs_its_bank_and_an_own_source_its_source()
    {
        var bank = Details() with { BankId = null };
        var own = Details(source: SourceKind.Own) with { SourceId = null };

        ((Action)(() => Account.Create(Guid.CreateVersion7(), bank, Now))).Should().Throw<ArgumentException>();
        ((Action)(() => Account.Create(Guid.CreateVersion7(), own, Now))).Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Its_currency_is_one_the_app_knows()
    {
        var act = () => Account.Create(Guid.CreateVersion7(), Details(currency: "XYZ"), Now);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Archiving_keeps_the_first_date_and_restoring_brings_it_back()
    {
        var account = Account.Create(Guid.CreateVersion7(), Details(), Now);

        account.Archive(Now);
        account.Archive(Now.AddDays(1));
        account.ArchivedAt.Should().Be(Now);
        account.IsArchived.Should().BeTrue();

        account.Restore();
        account.IsArchived.Should().BeFalse();
    }

    [Theory]
    [InlineData(SourceKind.Bank, CardStyle.Solid)]
    [InlineData(SourceKind.Cash, CardStyle.Envelope)]
    [InlineData(SourceKind.Own, CardStyle.Plain)]
    public void A_new_card_takes_its_source_style(SourceKind source, CardStyle expected)
    {
        CardStyles.DefaultFor(source).Should().Be(expected);
    }

    [Fact]
    public void The_currencies_are_the_hryvnia_and_the_nbu_list()
    {
        Currencies.All[0].Should().Be("UAH");
        Currencies.All.Should().OnlyHaveUniqueItems().And.Contain(["USD", "EUR", "PLN", "GBP"])
            .And.OnlyContain(code => code.Length == Currencies.CodeLength && code.All(char.IsAsciiLetterUpper));
        Currencies.IsKnown("usd").Should().BeFalse();
        Currencies.IsKnown(null).Should().BeFalse();
    }
}
