using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Domain.Tests.Families;

/// <summary>What Olena may see of Andriy's money, from his settings (F-030).</summary>
public sealed class KeptFromFamilyTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 12, 9, 0, 0, TimeSpan.Zero);
    private static readonly Guid Olena = Guid.CreateVersion7();
    private static readonly Guid Andriy = Guid.CreateVersion7();

    // Andriy's accounts: his card shared in full, cash balance only, dollars in the box hidden
    private static readonly Guid Card = Guid.CreateVersion7();
    private static readonly Guid Pocket = Guid.CreateVersion7();
    private static readonly Guid Dollars = Guid.CreateVersion7();
    private static readonly Guid Groceries = Guid.CreateVersion7();
    private static readonly Guid Gifts = Guid.CreateVersion7();

    // Olena's own, which she keeps from Andriy: none of it is kept from herself
    private static readonly Guid OlenasBox = Guid.CreateVersion7();
    private static readonly Guid OlenasGifts = Guid.CreateVersion7();

    private static KeptFromFamily AndriysSettings(params Guid[] sharingTotalsOnly) => KeptFromFamily.For(
        Olena,
        [
            new KeptAccount(Pocket, Andriy, AccountShare.BalanceOnly),
            new KeptAccount(Dollars, Andriy, AccountShare.Hidden),
            new KeptAccount(OlenasBox, Olena, AccountShare.Hidden),
        ],
        [new KeptCategory(Gifts, Andriy), new KeptCategory(OlenasGifts, Olena)],
        sharingTotalsOnly);

    private static Transaction Expense(Guid accountId, Guid categoryId, Guid? owner = null) => Transaction.Create(
        owner ?? Andriy,
        new TransactionDetails(
            TransactionType.Expense, new DateOnly(2026, 11, 12), accountId, categoryId, 500m, "Silpo"),
        Now);

    private static Transaction Transfer(Guid from, Guid to) => Transaction.Create(
        Andriy,
        new TransactionDetails(TransactionType.Transfer, new DateOnly(2026, 11, 12), from, null, 100m, null, to, 100m),
        Now);

    private static CategoryGroup GroupOf(string name) =>
        new() { Id = Guid.CreateVersion7(), UserId = Andriy, Name = name, Kind = CategoryKind.Expense };

    private static bool Counted(KeptFromFamily kept, Transaction transaction) =>
        kept.Counted.Compile()(transaction);

    private static bool Listed(KeptFromFamily kept, Transaction transaction) =>
        Counted(kept, transaction) && kept.Listed.Compile()(transaction);

    private static bool OnlyInTotals(KeptFromFamily kept, Transaction transaction) =>
        Counted(kept, transaction) && kept.Unlisted.Compile()(transaction);

    [Fact]
    public void Nothing_kept_counts_and_lists_everything()
    {
        var kept = KeptFromFamily.Nothing;

        kept.IsNothing.Should().BeTrue();
        Listed(kept, Expense(Dollars, Gifts)).Should().BeTrue();
        kept.Shows(Dollars).Should().BeTrue();
    }

    [Fact]
    public void A_line_on_an_account_shared_in_full_is_listed()
    {
        var kept = AndriysSettings();

        kept.IsNothing.Should().BeFalse();
        Listed(kept, Expense(Card, Groceries)).Should().BeTrue();
    }

    [Fact]
    public void A_hidden_account_is_gone_with_its_lines_and_their_totals()
    {
        var kept = AndriysSettings();

        kept.Shows(Dollars).Should().BeFalse();
        kept.HiddenAccounts.Should().Equal(Dollars);
        Counted(kept, Expense(Dollars, Groceries)).Should().BeFalse();
    }

    [Fact]
    public void A_balance_only_accounts_lines_count_in_the_totals_but_are_not_listed()
    {
        var kept = AndriysSettings();

        kept.Shows(Pocket).Should().BeTrue();
        kept.ShowsBalanceOnly(Pocket).Should().BeTrue();
        OnlyInTotals(kept, Expense(Pocket, Groceries)).Should().BeTrue();
        Listed(kept, Expense(Pocket, Groceries)).Should().BeFalse();
    }

    [Fact]
    public void A_private_category_is_gone_from_the_totals_too()
    {
        var kept = AndriysSettings();

        kept.ShowsCategory(Gifts).Should().BeFalse();
        Counted(kept, Expense(Card, Gifts)).Should().BeFalse();
    }

    [Fact]
    public void Sharing_only_totals_counts_every_line_and_lists_none()
    {
        var kept = AndriysSettings(Andriy);

        kept.SharesTotalsOnly(Andriy).Should().BeTrue();
        OnlyInTotals(kept, Expense(Card, Groceries)).Should().BeTrue();
        Listed(kept, Transfer(Card, Pocket)).Should().BeFalse();
    }

    [Fact]
    public void The_stricter_setting_wins()
    {
        var kept = AndriysSettings(Andriy);

        // Totals only and a private category: gone, not counted
        Counted(kept, Expense(Card, Gifts)).Should().BeFalse();
        // Balance only and a private category: gone
        Counted(kept, Expense(Pocket, Gifts)).Should().BeFalse();
    }

    [Fact]
    public void A_transfer_with_a_hidden_account_stays_on_the_shown_side()
    {
        var kept = AndriysSettings();

        Listed(kept, Transfer(Card, Dollars)).Should().BeTrue();
        Listed(kept, Transfer(Dollars, Card)).Should().BeTrue();
        // Into a balance-only account: counted, not listed
        OnlyInTotals(kept, Transfer(Dollars, Pocket)).Should().BeTrue();
    }

    [Fact]
    public void A_transfer_between_two_hidden_accounts_is_gone()
    {
        var secondBox = Guid.CreateVersion7();
        var kept = KeptFromFamily.For(
            Olena,
            [
                new KeptAccount(Dollars, Andriy, AccountShare.Hidden),
                new KeptAccount(secondBox, Andriy, AccountShare.Hidden),
            ],
            [],
            []);

        Counted(kept, Transfer(Dollars, secondBox)).Should().BeFalse();
    }

    [Fact]
    public void The_viewer_sees_all_of_their_own()
    {
        var kept = AndriysSettings(Olena);

        kept.Shows(OlenasBox).Should().BeTrue();
        kept.ShowsCategory(OlenasGifts).Should().BeTrue();
        kept.SharesTotalsOnly(Olena).Should().BeFalse();
        Listed(kept, Expense(OlenasBox, OlenasGifts, Olena)).Should().BeTrue();
    }

    [Fact]
    public void Shown_groups_leave_out_the_private_categories_and_a_group_left_empty()
    {
        var kept = AndriysSettings();
        var presents = GroupOf("Presents");
        presents.Categories.Add(new Category { Id = Gifts, GroupId = presents.Id, Name = "Gifts" });
        var daily = GroupOf("Daily living");
        daily.Categories.Add(new Category { Id = Groceries, GroupId = daily.Id, Name = "Groceries" });
        var empty = GroupOf("New");

        var shown = kept.Shown([presents, daily, empty]);

        shown.Select(group => group.Name).Should().Equal("Daily living", "New");
        shown[0].Categories.Select(category => category.Name).Should().Equal("Groceries");
        presents.Categories.Should().ContainSingle("the groups given stay as they were");
    }

    [Fact]
    public void A_private_group_is_gone_with_every_category_in_it()
    {
        var home = GroupOf("Home expenses");
        var rent = Guid.CreateVersion7();
        home.Categories.Add(new Category { Id = rent, GroupId = home.Id, Name = "Rent" });
        var daily = GroupOf("Daily living");
        daily.Categories.Add(new Category { Id = Groceries, GroupId = daily.Id, Name = "Groceries" });
        var empty = GroupOf("Saved for later");
        // The service gives the group's categories as kept ones too
        var kept = KeptFromFamily.For(
            Olena,
            [],
            [new KeptCategory(rent, Andriy)],
            [],
            [new KeptGroup(home.Id, Andriy), new KeptGroup(empty.Id, Andriy)]);

        kept.IsNothing.Should().BeFalse();
        kept.Shown([home, daily, empty]).Select(group => group.Name).Should().Equal("Daily living");
        Counted(kept, Expense(Card, rent)).Should().BeFalse();
        Listed(kept, Expense(Card, Groceries)).Should().BeTrue();
    }

    [Fact]
    public void The_viewers_own_private_group_is_theirs_to_see()
    {
        var home = GroupOf("Home expenses");
        var kept = KeptFromFamily.For(Olena, [], [], [], [new KeptGroup(home.Id, Olena)]);

        kept.IsNothing.Should().BeTrue();
        kept.Shown([home]).Should().ContainSingle();
    }

    [Fact]
    public void An_account_starts_shared_in_full_and_its_share_can_change()
    {
        var account = Account.Create(
            Andriy,
            new AccountDetails(
                "Pocket", Currencies.Hryvnia, SourceKind.Cash, null, null, 0m, new DateOnly(2026, 11, 1), CardStyle.Envelope),
            Now);

        account.FamilySees.Should().Be(AccountShare.Everything);
        account.ShareWithFamily(AccountShare.BalanceOnly);
        account.FamilySees.Should().Be(AccountShare.BalanceOnly);
        account.Invoking(a => a.ShareWithFamily((AccountShare)7)).Should().Throw<ArgumentOutOfRangeException>();
    }
}
