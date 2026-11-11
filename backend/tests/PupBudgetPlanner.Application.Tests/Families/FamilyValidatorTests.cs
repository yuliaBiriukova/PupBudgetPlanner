using PupBudgetPlanner.Application.Families;

namespace PupBudgetPlanner.Application.Tests.Families;

public sealed class FamilyValidatorTests
{
    private readonly StartFamilyRequestValidator start = new();
    private readonly RenameFamilyRequestValidator rename = new();
    private readonly JoinFamilyRequestValidator join = new();

    [Fact]
    public void A_family_needs_a_name()
    {
        start.Validate(new StartFamilyRequest("Kovalenko")).IsValid.Should().BeTrue();

        foreach (var name in new[] { "", "   " })
        {
            start.Validate(new StartFamilyRequest(name)).Errors.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Give the family a name.");
            rename.Validate(new RenameFamilyRequest(name)).Errors.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Give the family a name.");
        }
    }

    [Fact]
    public void Its_name_takes_at_most_40_characters_not_counting_spaces_around_them()
    {
        start.Validate(new StartFamilyRequest($"  {new string('a', 40)}  ")).IsValid.Should().BeTrue();

        start.Validate(new StartFamilyRequest(new string('a', 41))).Errors.Should().ContainSingle()
            .Which.ErrorMessage.Should().Be("Use at most 40 characters.");
        rename.Validate(new RenameFamilyRequest(new string('a', 41))).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Joining_needs_the_links_token_of_a_sane_length()
    {
        join.Validate(new JoinFamilyRequest("k7x9f2qa")).IsValid.Should().BeTrue();
        join.Validate(new JoinFamilyRequest("")).IsValid.Should().BeFalse();
        join.Validate(new JoinFamilyRequest(new string('a', 101))).IsValid.Should().BeFalse();
    }
}
