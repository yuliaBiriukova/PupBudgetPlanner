using PupBudgetPlanner.Application.Access;

namespace PupBudgetPlanner.Application.Tests.Access;

public sealed class AccessTests
{
    [Theory]
    [InlineData("yulia@example.com", true)]
    [InlineData(" YULIA@example.com ", true)]
    [InlineData("vlad@example.com", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void The_admin_is_found_by_email_ignoring_case_and_spaces(string? email, bool expected)
    {
        var options = new AccessOptions();
        options.AdminEmails.Add("Yulia@Example.com");

        options.IsAdmin(email).Should().Be(expected);
    }

    [Fact]
    public void Sign_up_is_invite_only_unless_configured_otherwise()
    {
        new AccessOptions().SignUp.Should().Be(SignUpMode.InviteOnly);
        new AccessOptions().AdminPasswordSignUp.Should().BeFalse();
    }

    [Theory]
    [InlineData(null, true)]
    [InlineData("For Mom", true)]
    [InlineData("12345678901234567890123456789012345678901234567890123456789012345", false)]
    public void A_note_is_optional_and_short(string? note, bool valid)
    {
        new CreateInvitationRequestValidator().Validate(new CreateInvitationRequest(note)).IsValid.Should().Be(valid);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(PeopleRequestValidator.MaxPeople, true)]
    [InlineData(PeopleRequestValidator.MaxPeople + 1, false)]
    public void An_admin_action_is_for_at_least_one_and_a_bounded_number_of_people(int count, bool valid)
    {
        var request = new PeopleRequest(Enumerable.Range(0, count).Select(_ => Guid.CreateVersion7()).ToList());

        new PeopleRequestValidator().Validate(request).IsValid.Should().Be(valid);
    }
}
