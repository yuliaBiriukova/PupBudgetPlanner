using PupBudgetPlanner.Application.Jars;
using PupBudgetPlanner.Domain.Jars;

namespace PupBudgetPlanner.Application.Tests.Jars;

public sealed class JarValidatorTests
{
    /// <summary>17 November 2026 in Kyiv.</summary>
    private sealed class MidNovember : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 17, 10, 0, 0, TimeSpan.Zero);
    }

    private static readonly Guid Car = Guid.CreateVersion7();
    private static readonly Guid Account = Guid.CreateVersion7();

    private readonly SaveJarRequestValidator jarValidator = new();
    private readonly JarMoveRequestValidator moveValidator = new();
    private readonly SavedMoneyRequestValidator savedValidator = new(new MidNovember());

    private static SaveJarRequest Jar(
        string name = "Car", string currency = "UAH", decimal? goal = 400_000, string? by = "2027-12", string? note = null) =>
        new(name, JarIcon.Car, JarColor.Blue, currency, goal, by, note);

    [Fact]
    public void A_jar_with_a_name_a_currency_and_nothing_else_is_fine() =>
        jarValidator.Validate(Jar(goal: null, by: null)).IsValid.Should().BeTrue();

    [Fact]
    public void A_goal_and_a_month_are_fine() => jarValidator.Validate(Jar()).IsValid.Should().BeTrue();

    [Theory]
    [InlineData("", "UAH", 1, "2027-12")]
    [InlineData("A name longer than forty characters for a jar", "UAH", 1, "2027-12")]
    [InlineData("Car", "XYZ", 1, "2027-12")]
    [InlineData("Car", "uah", 1, "2027-12")]
    [InlineData("Car", "UAH", 0, "2027-12")]
    [InlineData("Car", "UAH", 1, "December")]
    [InlineData("Car", "UAH", 1, "2027-13")]
    public void Anything_else_is_a_mistake(string name, string currency, int goal, string by) =>
        jarValidator.Validate(Jar(name, currency, goal, by)).IsValid.Should().BeFalse();

    [Fact]
    public void A_note_is_at_most_200_characters() =>
        jarValidator.Validate(Jar(note: new string('a', 201))).IsValid.Should().BeFalse();

    [Fact]
    public void Money_moves_in_whole_amounts_above_zero()
    {
        moveValidator.Validate(new JarMoveRequest(JarMoveAction.In, Account, 5_000, null)).IsValid.Should().BeTrue();
        moveValidator.Validate(new JarMoveRequest(JarMoveAction.Out, Account, 0.4m, null)).IsValid.Should().BeFalse();
        moveValidator.Validate(new JarMoveRequest(JarMoveAction.Out, Account, -5, null)).IsValid.Should().BeFalse();
    }

    [Fact]
    public void A_move_to_another_jar_names_it()
    {
        moveValidator.Validate(new JarMoveRequest(JarMoveAction.Move, Account, 5_000, null)).IsValid.Should().BeFalse();
        moveValidator.Validate(new JarMoveRequest(JarMoveAction.Move, Account, 5_000, Car)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Saved_money_goes_into_at_least_one_jar_each_jar_once()
    {
        var part = new SavedMoneyPart(Car, Account, 3_000);

        savedValidator.Validate(new SavedMoneyRequest("2026-11", SavedMoneyWay.Net, [part])).IsValid.Should().BeTrue();
        savedValidator.Validate(new SavedMoneyRequest("2026-11", SavedMoneyWay.Net, [])).IsValid.Should().BeFalse();
        savedValidator.Validate(new SavedMoneyRequest("2026-11", SavedMoneyWay.Net, [part, part]))
            .IsValid.Should().BeFalse();
        savedValidator.Validate(new SavedMoneyRequest("2026-11", SavedMoneyWay.Net, [part with { Amount = 0 }]))
            .IsValid.Should().BeFalse();
        savedValidator.Validate(new SavedMoneyRequest("2027-02", SavedMoneyWay.Net, [part])).IsValid.Should().BeFalse();
    }
}
