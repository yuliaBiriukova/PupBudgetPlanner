using PupBudgetPlanner.Application.Families;

namespace PupBudgetPlanner.Application.Tests.Families;

/// <summary>Whose money a page asks for (F-024).</summary>
public sealed class MoneyScopeTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("me")]
    [InlineData(" Me ")]
    public void Nothing_or_me_is_your_own(string? text)
    {
        Who.TryParse(text, out var who).Should().BeTrue();
        who.IsMe.Should().BeTrue();
    }

    [Fact]
    public void Family_or_a_members_id_is_theirs()
    {
        var andriy = Guid.CreateVersion7();

        Who.TryParse("family", out var family).Should().BeTrue();
        Who.TryParse(andriy.ToString(), out var person).Should().BeTrue();

        family.Should().Be(Who.Family);
        person.Should().Be(Who.Person(andriy));
        person.IsMe.Should().BeFalse();
    }

    [Theory]
    [InlineData("everyone")]
    [InlineData("01a181d1")]
    public void Anything_else_is_not_read(string text)
    {
        Who.TryParse(text, out _).Should().BeFalse();
    }

    [Fact]
    public void Scopes_are_equal_by_their_viewer_and_people_in_order()
    {
        var olena = Guid.CreateVersion7();
        var andriy = Guid.CreateVersion7();

        MoneyScope.Own(olena).Should().Be(new MoneyScope(olena, [olena]));
        new MoneyScope(olena, [olena, andriy]).Should().Be(new MoneyScope(olena, [olena, andriy]));
        new MoneyScope(olena, [olena, andriy]).Should().NotBe(new MoneyScope(olena, [andriy, olena]));
        new MoneyScope(olena, [andriy]).Should().NotBe(new MoneyScope(andriy, [andriy]));
        MoneyScope.Own(olena).IsTogether.Should().BeFalse();
        new MoneyScope(olena, [olena, andriy]).IsTogether.Should().BeTrue();
    }
}
