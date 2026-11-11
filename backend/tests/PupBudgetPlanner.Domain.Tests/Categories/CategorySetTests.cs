using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Domain.Tests.Categories;

/// <summary>Adding, renaming, moving, hiding and deleting a person's categories and groups (F-029).</summary>
public sealed class CategorySetTests
{
    private static readonly Guid Olena = Guid.CreateVersion7();

    private readonly CategorySet set = new(Olena, DefaultCategories.CreateFor(Olena));

    private CategoryGroup Group(string name) => set.Groups.Single(group => group.Name == name);

    private Category Category(string group, string name) =>
        set.CategoriesOf(Group(group).Id).Single(category => category.Name == name);

    /// <summary>"Subscriptions: Spotify, Phone, Subscriptions" with the hidden ones as "(Netflix)", in sort order.</summary>
    private string Line(string group)
    {
        var categories = set.CategoriesOf(Group(group).Id);
        categories.Select(category => category.SortOrder).Should().Equal(Enumerable.Range(1, categories.Count));
        return $"{group}: " + string.Join(", ", categories.Select(c => c.IsArchived ? $"({c.Name})" : c.Name));
    }

    private string Kinds()
    {
        set.Groups.Select(group => group.SortOrder).Should().Equal(Enumerable.Range(1, set.Groups.Count));
        return string.Join(", ", set.Groups.Select(g => g.IsArchived ? $"({g.Name})" : g.Name));
    }

    private void Hide(string group, string name) =>
        set.RemoveCategory(Category(group, name).Id, transactionCount: 3).Removal.Should().Be(Removal.Hidden);

    [Fact]
    public void A_new_category_goes_at_its_place_or_at_the_end_of_the_group()
    {
        var pets = set.AddCategory(Group("Daily living").Id, "  Pets ", place: 1);
        set.AddCategory(Group("Daily living").Id, "Kids", place: null);

        pets.Outcome.Should().Be(CategoryOutcome.Done);
        pets.Category!.Name.Should().Be("Pets");
        Line("Daily living").Should().Be(
            "Daily living: Groceries, Pets, Clothing, Eating out, Transportation, Salon/Barber, Sport, Kids");
    }

    [Fact]
    public void A_place_past_the_end_is_the_end()
    {
        set.AddCategory(Group("Education").Id, "Swimming", place: 40);

        Line("Education").Should().Be("Education: English lessons, Piano lessons, Driving, Swimming");
    }

    [Theory]
    [InlineData("Spotify")]
    [InlineData("spotify ")]
    [InlineData("SPOTIFY")]
    public void A_name_in_use_in_the_group_is_taken_ignoring_case_and_spaces(string name)
    {
        set.AddCategory(Group("Subscriptions").Id, name, null).Outcome.Should().Be(CategoryOutcome.NameTaken);
        Line("Subscriptions").Should().Be("Subscriptions: Spotify, Phone, Subscriptions");
    }

    [Fact]
    public void Names_are_unique_per_group_only_and_ignore_case_in_ukrainian_too()
    {
        set.AddCategory(Group("Daily living").Id, "Gifts", null).Outcome.Should().Be(CategoryOutcome.Done);
        set.AddCategory(Group("Daily living").Id, "Кава", null).Outcome.Should().Be(CategoryOutcome.Done);

        set.AddCategory(Group("Daily living").Id, "КАВА", null).Outcome.Should().Be(CategoryOutcome.NameTaken);
    }

    [Fact]
    public void A_hidden_categorys_name_is_taken_too_and_says_so()
    {
        Hide("Subscriptions", "Spotify");

        set.AddCategory(Group("Subscriptions").Id, "spotify", null).Outcome
            .Should().Be(CategoryOutcome.NameTakenByHidden);
    }

    [Fact]
    public void A_category_is_renamed_and_moved_up_in_its_group()
    {
        var phone = Category("Subscriptions", "Phone");

        set.UpdateCategory(phone.Id, "Mobile", phone.GroupId, place: 0).Outcome.Should().Be(CategoryOutcome.Done);

        Line("Subscriptions").Should().Be("Subscriptions: Mobile, Spotify, Subscriptions");
    }

    [Fact]
    public void A_category_keeps_its_place_when_none_is_given_and_may_keep_its_name_in_other_case()
    {
        var books = Category("Entertainment", "Books");

        set.UpdateCategory(books.Id, "BOOKS", books.GroupId, place: null).Outcome.Should().Be(CategoryOutcome.Done);

        Line("Entertainment").Should().Be("Entertainment: Activities, BOOKS, Games, Hobbies, Vacation");
    }

    [Fact]
    public void A_category_moves_to_another_group_of_its_kind_and_both_are_renumbered()
    {
        var sport = Category("Daily living", "Sport");

        set.UpdateCategory(sport.Id, "Sport", Group("Health").Id, place: 1).Outcome.Should().Be(CategoryOutcome.Done);

        sport.GroupId.Should().Be(Group("Health").Id);
        Line("Health").Should().Be("Health: Doctor/Dentist, Sport, Medicine/Drugs/Skincare, Emergency, Therapy");
        Line("Daily living").Should().Be("Daily living: Groceries, Clothing, Eating out, Transportation, Salon/Barber");
    }

    [Fact]
    public void A_category_moved_without_a_place_goes_at_the_end()
    {
        var tax = Category("Home expenses", "Tax");

        set.UpdateCategory(tax.Id, "Tax", Group("Education").Id, place: null);

        Line("Education").Should().Be("Education: English lessons, Piano lessons, Driving, Tax");
    }

    [Fact]
    public void A_category_cant_move_to_the_other_kind_or_onto_a_name_in_use_there()
    {
        var salary = Category("Income", "Salary");
        var gifts = Category("Home expenses", "Gifts");

        set.UpdateCategory(salary.Id, "Salary", Group("Health").Id, null).Outcome.Should().Be(CategoryOutcome.OtherKind);
        set.UpdateCategory(gifts.Id, "Gifts", Group("Home expenses").Id, null).Outcome.Should().Be(CategoryOutcome.Done);
        set.UpdateCategory(Category("Daily living", "Sport").Id, "Therapy", Group("Health").Id, null).Outcome
            .Should().Be(CategoryOutcome.NameTaken);
        Line("Health").Should().Be("Health: Doctor/Dentist, Medicine/Drugs/Skincare, Emergency, Therapy");
    }

    [Fact]
    public void Another_persons_or_a_made_up_id_is_not_found()
    {
        var made = Guid.CreateVersion7();
        var group = Group("Health").Id;

        set.AddCategory(made, "Pets", null).Outcome.Should().Be(CategoryOutcome.NotFound);
        set.UpdateCategory(made, "Pets", group, null).Outcome.Should().Be(CategoryOutcome.NotFound);
        set.UpdateCategory(Category("Health", "Therapy").Id, "Therapy", made, null).Outcome
            .Should().Be(CategoryOutcome.NotFound);
        set.RemoveCategory(made, 0).Outcome.Should().Be(CategoryOutcome.NotFound);
        set.RestoreCategory(made).Outcome.Should().Be(CategoryOutcome.NotFound);
        set.UpdateGroup(made, "X", null).Outcome.Should().Be(CategoryOutcome.NotFound);
        set.RemoveGroup(made).Outcome.Should().Be(CategoryOutcome.NotFound);
        set.RestoreGroup(made).Outcome.Should().Be(CategoryOutcome.NotFound);
    }

    [Fact]
    public void A_category_without_transactions_is_deleted_for_good()
    {
        var tax = Category("Home expenses", "Tax");

        var removal = set.RemoveCategory(tax.Id, transactionCount: 0);

        removal.Removal.Should().Be(Removal.Deleted);
        removal.Removed.Should().BeSameAs(tax);
        Line("Home expenses").Should().Be(
            "Home expenses: Rent, Bills, Home supplies, Electronics, Bank commission, Gifts, Delivery, Other");
    }

    [Fact]
    public void A_category_with_transactions_is_hidden_at_the_end_of_its_group()
    {
        var removal = set.RemoveCategory(Category("Subscriptions", "Spotify").Id, transactionCount: 12);

        removal.Removal.Should().Be(Removal.Hidden);
        removal.Removed.Should().BeNull();
        Line("Subscriptions").Should().Be("Subscriptions: Phone, Subscriptions, (Spotify)");
    }

    [Fact]
    public void A_hidden_category_is_shown_again_at_the_end_of_its_group()
    {
        Hide("Subscriptions", "Spotify");
        Hide("Subscriptions", "Phone");

        set.RestoreCategory(Category("Subscriptions", "Spotify").Id).Outcome.Should().Be(CategoryOutcome.Done);

        Line("Subscriptions").Should().Be("Subscriptions: Subscriptions, Spotify, (Phone)");
    }

    [Fact]
    public void A_hidden_category_is_shown_again_before_it_is_changed()
    {
        Hide("Subscriptions", "Spotify");
        var spotify = Category("Subscriptions", "Spotify");

        set.UpdateCategory(spotify.Id, "Music", spotify.GroupId, null).Outcome.Should().Be(CategoryOutcome.Hidden);
    }

    [Fact]
    public void A_new_group_goes_at_its_place_among_its_kind_and_income_stays_first()
    {
        var bonus = set.AddGroup(CategoryKind.Income, "Side jobs", place: null);
        set.AddGroup(CategoryKind.Expense, "Pets", place: 0);
        set.AddGroup(CategoryKind.Expense, "Car", place: null);

        bonus.Group!.UserId.Should().Be(Olena);
        Kinds().Should().Be(
            "Income, Side jobs, Pets, Home expenses, Daily living, Health, Education, Entertainment, Subscriptions, Car");
    }

    [Fact]
    public void A_groups_name_is_unique_per_person_ignoring_case()
    {
        set.AddGroup(CategoryKind.Income, "health", null).Outcome.Should().Be(CategoryOutcome.NameTaken);
        set.UpdateGroup(Group("Education").Id, " HEALTH ", null).Outcome.Should().Be(CategoryOutcome.NameTaken);
        set.UpdateGroup(Group("Education").Id, "EDUCATION", null).Outcome.Should().Be(CategoryOutcome.Done);
    }

    [Fact]
    public void A_group_is_renamed_and_moved_among_its_kind_only()
    {
        set.UpdateGroup(Group("Subscriptions").Id, "Online", place: 0).Outcome.Should().Be(CategoryOutcome.Done);
        set.UpdateGroup(Group("Health").Id, "Health", place: 99);

        Kinds().Should().Be("Income, Online, Home expenses, Daily living, Education, Entertainment, Health");
    }

    [Fact]
    public void A_group_with_shown_categories_or_the_last_of_its_kind_stays()
    {
        set.RemoveGroup(Group("Health").Id).Outcome.Should().Be(CategoryOutcome.StillHasCategories);
        set.RemoveGroup(Group("Income").Id).Outcome.Should().Be(CategoryOutcome.LastOfKind);
    }

    [Fact]
    public void An_empty_group_is_deleted_and_one_with_only_hidden_categories_hidden()
    {
        var pets = set.AddGroup(CategoryKind.Expense, "Pets", null).Group!;
        foreach (var name in new[] { "English lessons", "Piano lessons", "Driving" })
        {
            Hide("Education", name);
        }

        var deleted = set.RemoveGroup(pets.Id);
        var hidden = set.RemoveGroup(Group("Education").Id);

        deleted.Removal.Should().Be(Removal.Deleted);
        deleted.Removed.Should().BeSameAs(pets);
        hidden.Removal.Should().Be(Removal.Hidden);
        Kinds().Should().Be(
            "Income, Home expenses, Daily living, Health, (Education), Entertainment, Subscriptions");
    }

    [Fact]
    public void A_hidden_group_takes_no_categories_and_comes_back_with_one_of_them()
    {
        Hide("Education", "English lessons");
        Hide("Education", "Piano lessons");
        Hide("Education", "Driving");
        set.RemoveGroup(Group("Education").Id);

        set.AddCategory(Group("Education").Id, "Swimming", null).Outcome.Should().Be(CategoryOutcome.Hidden);
        set.UpdateGroup(Group("Education").Id, "School", null).Outcome.Should().Be(CategoryOutcome.Hidden);
        set.RestoreCategory(Category("Education", "Driving").Id);

        Group("Education").IsArchived.Should().BeFalse();
        Line("Education").Should().Be("Education: Driving, (English lessons), (Piano lessons)");
    }

    [Fact]
    public void A_hidden_group_is_shown_again_where_it_was_and_hidden_ones_dont_count_as_the_last()
    {
        var pets = set.AddGroup(CategoryKind.Income, "Pets", null).Group!;
        set.AddCategory(pets.Id, "Food", null);
        Hide("Pets", "Food");
        set.RemoveGroup(pets.Id).Removal.Should().Be(Removal.Hidden);

        set.RemoveGroup(Group("Income").Id).Outcome.Should().Be(CategoryOutcome.LastOfKind);
        set.RestoreGroup(pets.Id).Outcome.Should().Be(CategoryOutcome.Done);

        Kinds().Should().StartWith("Income, Pets, Home expenses");
    }
}
