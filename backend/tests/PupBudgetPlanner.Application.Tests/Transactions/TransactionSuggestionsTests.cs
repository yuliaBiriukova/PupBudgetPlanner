using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Transactions;

public sealed class TransactionSuggestionsTests
{
    private static readonly DateOnly Today = new(2026, 11, 1);
    private static readonly DateTimeOffset Start = new(2026, 10, 1, 9, 0, 0, TimeSpan.Zero);

    private static readonly Guid Mono = Guid.CreateVersion7();
    private static readonly Guid Wallet = Guid.CreateVersion7();
    private static readonly Guid Privat = Guid.CreateVersion7();
    private static readonly Guid Groceries = Guid.CreateVersion7();
    private static readonly Guid EatingOut = Guid.CreateVersion7();
    private static readonly Guid Taxi = Guid.CreateVersion7();
    private static readonly Guid Salary = Guid.CreateVersion7();

    /// <summary>The <paramref name="order"/>th transaction added; its day <paramref name="daysAgo"/> before today.</summary>
    private static RecentTransaction Added(
        int order, Guid account, Guid category, TransactionType type = TransactionType.Expense, int daysAgo = 0) =>
        new(type, account, category, Today.AddDays(-daysAgo), Start.AddMinutes(order));

    [Fact]
    public void Nothing_added_yet_suggests_nothing()
    {
        var suggestions = TransactionSuggestions.From([], Today);

        suggestions.LastAccounts.Should().BeEmpty();
        suggestions.LastCategories.Should().BeEmpty();
        suggestions.MostUsed.Should().BeEmpty();
    }

    [Fact]
    public void The_last_account_is_the_last_added_for_each_type_whatever_its_day()
    {
        var suggestions = TransactionSuggestions.From(
            [
                Added(1, Mono, Groceries),
                Added(2, Privat, Salary, TransactionType.Income),
                // Typed in late: an old receipt, added last
                Added(3, Wallet, EatingOut, daysAgo: 20),
            ],
            Today);

        suggestions.LastAccounts.Should().Equal(
            new LastAccount(TransactionType.Expense, Wallet), new LastAccount(TransactionType.Income, Privat));
    }

    [Fact]
    public void Each_account_has_its_last_category_for_each_type()
    {
        var suggestions = TransactionSuggestions.From(
            [
                Added(1, Mono, EatingOut),
                Added(2, Mono, Groceries),
                Added(3, Wallet, EatingOut),
                Added(4, Mono, Salary, TransactionType.Income),
            ],
            Today);

        suggestions.LastCategories.Should().BeEquivalentTo([
            new LastCategory(TransactionType.Expense, Mono, Groceries),
            new LastCategory(TransactionType.Expense, Wallet, EatingOut),
            new LastCategory(TransactionType.Income, Mono, Salary),
        ]);
    }

    [Fact]
    public void The_most_used_come_first_and_a_tie_goes_to_the_one_used_last()
    {
        var suggestions = TransactionSuggestions.From(
            [
                Added(1, Mono, Taxi),
                Added(2, Mono, Groceries),
                Added(3, Wallet, Groceries),
                Added(4, Wallet, EatingOut),
                Added(5, Mono, Taxi),
                Added(6, Privat, Salary, TransactionType.Income),
            ],
            Today);

        suggestions.MostUsed.Should().BeEquivalentTo(
            [
                new MostUsedCategories(TransactionType.Expense, [Taxi, Groceries, EatingOut]),
                new MostUsedCategories(TransactionType.Income, [Salary]),
            ],
            options => options.WithStrictOrdering());
    }

    [Fact]
    public void The_most_used_count_the_last_90_days_only()
    {
        var suggestions = TransactionSuggestions.From(
            [
                Added(1, Mono, Taxi, daysAgo: 120),
                Added(2, Mono, Taxi, daysAgo: 100),
                Added(3, Mono, Groceries, daysAgo: 3),
            ],
            Today);

        suggestions.MostUsed.Should().ContainSingle().Which.CategoryIds.Should().Equal(Groceries);
    }

    [Fact]
    public void Without_anything_in_the_last_90_days_the_older_ones_count()
    {
        var suggestions = TransactionSuggestions.From(
            [Added(1, Mono, Taxi, daysAgo: 120), Added(2, Mono, Taxi, daysAgo: 100), Added(3, Mono, Groceries, daysAgo: 95)],
            Today);

        suggestions.MostUsed.Should().ContainSingle().Which.CategoryIds.Should().Equal(Taxi, Groceries);
    }

    [Fact]
    public void At_most_eight_are_suggested()
    {
        var categories = Enumerable.Range(0, 10).Select(_ => Guid.CreateVersion7()).ToList();

        var suggestions = TransactionSuggestions.From(
            categories.Select((category, i) => Added(i, Mono, category)), Today);

        suggestions.MostUsed.Single().CategoryIds.Should().HaveCount(TransactionSuggestions.MostUsedCount);
    }

    /// <summary>The <paramref name="order"/>th transaction added: a transfer, today.</summary>
    private static RecentTransaction Transferred(int order, Guid from, Guid to) =>
        new(TransactionType.Transfer, from, null, Today, Start.AddMinutes(order), to);

    [Fact]
    public void The_last_transfer_gives_its_from_and_to()
    {
        var suggestions = TransactionSuggestions.From(
            [Transferred(1, Mono, Wallet), Added(2, Mono, Groceries), Transferred(3, Privat, Mono)], Today);

        suggestions.LastTransfer.Should().Be(new LastTransfer(Privat, Mono));
        suggestions.LastAccounts.Should().Contain(new LastAccount(TransactionType.Transfer, Privat));
    }

    [Fact]
    public void Transfers_leave_the_categories_alone()
    {
        var suggestions = TransactionSuggestions.From(
            [Added(1, Mono, Groceries), Transferred(2, Mono, Wallet), Transferred(3, Mono, Wallet)], Today);

        suggestions.LastCategories.Should().Equal(new LastCategory(TransactionType.Expense, Mono, Groceries));
        suggestions.MostUsed.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new MostUsedCategories(TransactionType.Expense, [Groceries]));
    }

    [Fact]
    public void No_transfer_yet_no_last_transfer()
    {
        TransactionSuggestions.From([Added(1, Mono, Groceries)], Today).LastTransfer.Should().BeNull();
    }
}
