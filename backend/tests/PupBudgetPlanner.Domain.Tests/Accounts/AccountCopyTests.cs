using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Domain.Tests.Accounts;

/// <summary>No two accounts in use that look exactly alike (I-020).</summary>
public sealed class AccountCopyTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 4, 9, 0, 0, TimeSpan.Zero);
    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly Guid Mono = Guid.CreateVersion7();

    private static Account Monobank(string name = "Monobank") =>
        Account.Create(UserId, AccountTests.Details(name: name, bankId: Mono), Now);

    [Theory]
    [InlineData("Monobank")]
    [InlineData("monobank ")]
    [InlineData("  MONOBANK")]
    public void The_same_name_currency_source_and_bank_is_a_copy_ignoring_case_and_spaces(string typed)
    {
        var mono = Monobank();

        Account.CopyIn([mono], AccountTests.Details(name: typed, bankId: Mono)).Should().BeSameAs(mono);
    }

    [Fact]
    public void Names_match_ignoring_case_in_ukrainian_too()
    {
        var mono = Monobank("Картка");

        Account.CopyIn([mono], AccountTests.Details(name: "картка", bankId: Mono)).Should().BeSameAs(mono);
    }

    [Fact]
    public void Another_name_currency_bank_or_source_is_not_a_copy()
    {
        var mono = Monobank();

        Account.CopyIn([mono], AccountTests.Details(name: "Mono white", bankId: Mono)).Should().BeNull();
        Account.CopyIn([mono], AccountTests.Details(name: "Monobank", currency: "USD", bankId: Mono)).Should().BeNull();
        Account.CopyIn([mono], AccountTests.Details(name: "Monobank")).Should().BeNull("it is another bank");
        Account.CopyIn([mono], AccountTests.Details(name: "Monobank", source: SourceKind.Cash)).Should().BeNull();
    }

    [Fact]
    public void Own_sources_count_like_banks()
    {
        var box = Guid.CreateVersion7();
        var savings = Account.Create(
            UserId, AccountTests.Details(name: "Savings", source: SourceKind.Own, sourceId: box), Now);

        Account.CopyIn([savings], AccountTests.Details(name: "savings", source: SourceKind.Own, sourceId: box))
            .Should().BeSameAs(savings);
        Account.CopyIn([savings], AccountTests.Details(name: "Savings", source: SourceKind.Own)).Should().BeNull();
    }

    [Fact]
    public void Cash_in_the_same_currency_with_the_same_name_is_a_copy()
    {
        var wallet = Account.Create(UserId, AccountTests.Details(name: "Wallet", source: SourceKind.Cash), Now);

        Account.CopyIn([wallet], AccountTests.Details(name: "Wallet", source: SourceKind.Cash)).Should().BeSameAs(wallet);
    }

    [Fact]
    public void Archived_accounts_dont_count()
    {
        var closed = Monobank();
        closed.Archive(Now);

        Account.CopyIn([closed], AccountTests.Details(name: "Monobank", bankId: Mono)).Should().BeNull();
    }

    [Fact]
    public void The_account_being_changed_or_restored_is_not_its_own_copy()
    {
        var mono = Monobank();

        Account.CopyIn([mono], mono.Details, except: mono.Id).Should().BeNull();
    }

    [Fact]
    public void An_archived_account_brought_back_is_checked_against_the_ones_in_use()
    {
        var closed = Monobank();
        closed.Archive(Now);
        var inUse = Monobank("monobank");

        Account.CopyIn([closed, inUse], closed.Details, except: closed.Id).Should().BeSameAs(inUse);
    }

    [Fact]
    public void Its_details_are_what_was_saved()
    {
        var mono = Monobank(" Monobank ");

        mono.Details.Should().Be(new AccountDetails(
            "Monobank", "UAH", SourceKind.Bank, null, Mono, 21_500m, new DateOnly(2026, 1, 1), CardStyle.Solid));
    }
}
