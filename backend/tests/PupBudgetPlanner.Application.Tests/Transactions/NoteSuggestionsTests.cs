using PupBudgetPlanner.Application.Transactions;

namespace PupBudgetPlanner.Application.Tests.Transactions;

public sealed class NoteSuggestionsTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 4, 9, 0, 0, TimeSpan.Zero);

    /// <summary>A note used <paramref name="uses"/> times, the last of them <paramref name="daysAgo"/> days ago.</summary>
    private static UsedNote Used(string note, int uses, int daysAgo) => new(note, uses, Now.AddDays(-daysAgo));

    // The final prototype's notes (I-017 variant 4)
    private static readonly UsedNote[] Notes =
    [
        Used("Silpo", 14, 2),
        Used("Lunch with Vlad", 6, 5),
        Used("Taxi home", 5, 9),
        Used("Physio session", 4, 6),
        Used("Kids’ music lesson", 4, 12),
        Used("Simcard top-up", 3, 20),
        Used("Silpo, wine for Friday", 2, 4),
        Used("Basil and tomatoes, market", 1, 3),
        Used("АТБ", 9, 1),
        Used("Батарейки", 2, 15),
        Used("Квартплата за жовтень", 2, 33),
        Used("Вата і бинт", 1, 8),
    ];

    private static IEnumerable<string> Suggested(IEnumerable<UsedNote> notes, string? typed) =>
        NoteSuggestions.Of(notes, typed).Select(note => note.Note);

    [Fact]
    public void The_notes_that_start_with_it_come_first_then_the_others_each_by_use()
    {
        // Owner, 2026-11-04: "si" gives Silpo, Simcard top-up, Silpo, wine for Friday, then Physio session, Kids’ music
        // lesson
        Suggested(Notes, "si").Should().Equal(
            "Silpo", "Simcard top-up", "Silpo, wine for Friday", "Physio session", "Kids’ music lesson");
    }

    [Fact]
    public void Case_is_ignored_in_ukrainian_too()
    {
        Suggested(Notes, "ат").Should().Equal("АТБ", "Батарейки", "Квартплата за жовтень", "Вата і бинт");
        Suggested(Notes, "SIL").Should().Equal("Silpo", "Silpo, wine for Friday", "Basil and tomatoes, market");
    }

    [Fact]
    public void Between_two_used_as_often_the_one_used_last_comes_first()
    {
        Suggested([Used("Taxi to work", 3, 10), Used("Taxi home", 3, 2)], "taxi")
            .Should().Equal("Taxi home", "Taxi to work");
    }

    [Fact]
    public void At_most_five()
    {
        var many = Enumerable.Range(1, 8).Select(i => Used($"Lunch {i}", i, i));

        Suggested(many, "lunch").Should().Equal("Lunch 8", "Lunch 7", "Lunch 6", "Lunch 5", "Lunch 4");
    }

    [Fact]
    public void One_note_in_another_case_counts_as_the_same_written_as_the_last_time()
    {
        var suggested = NoteSuggestions.Of([Used("silpo", 3, 10), Used("Silpo", 2, 1), Used("Simcard", 4, 3)], "si");

        suggested.Should().Equal(new UsedNote("Silpo", 5, Now.AddDays(-1)), new UsedNote("Simcard", 4, Now.AddDays(-3)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Nothing_for_an_empty_field(string? typed)
    {
        Suggested(Notes, typed).Should().BeEmpty();
    }

    [Fact]
    public void None_that_equals_what_is_typed()
    {
        Suggested(Notes, "silpo ").Should().Equal("Silpo, wine for Friday");
    }

    [Fact]
    public void Nothing_when_no_note_has_it()
    {
        Suggested(Notes, "xyz").Should().BeEmpty();
    }
}
