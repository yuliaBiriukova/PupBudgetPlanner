using PupBudgetPlanner.Domain.Invitations;

namespace PupBudgetPlanner.Domain.Tests.Invitations;

public sealed class InvitationTests
{
    private static readonly DateTimeOffset Made = new(2026, 11, 10, 9, 0, 0, TimeSpan.Zero);

    private static Invitation New(string? note = "For Mom") => Invitation.Create(new byte[32], note, Guid.CreateVersion7(), Made);

    [Fact]
    public void A_new_invitation_waits_for_seven_days()
    {
        var invitation = New();

        invitation.ExpiresAt.Should().Be(Made.AddDays(7));
        invitation.StatusAt(Made).Should().Be(InvitationStatus.Waiting);
        invitation.StatusAt(Made.AddDays(7).AddTicks(-1)).Should().Be(InvitationStatus.Waiting);
    }

    [Fact]
    public void It_expires_at_the_end_of_the_seven_days()
    {
        New().StatusAt(Made.AddDays(7)).Should().Be(InvitationStatus.Expired);
    }

    [Theory]
    [InlineData("  For Mom ", "For Mom")]
    [InlineData("   ", null)]
    [InlineData(null, null)]
    public void The_note_is_trimmed_and_an_empty_one_is_no_note(string? note, string? expected)
    {
        New(note).Note.Should().Be(expected);
    }

    [Fact]
    public void A_waiting_invitation_can_be_cancelled_once()
    {
        var invitation = New();

        invitation.Cancel(Made.AddDays(1)).Should().BeTrue();
        invitation.StatusAt(Made.AddDays(1)).Should().Be(InvitationStatus.Cancelled);
        invitation.Cancel(Made.AddDays(2)).Should().BeFalse();
        invitation.CancelledAt.Should().Be(Made.AddDays(1));
    }

    [Fact]
    public void An_expired_invitation_stays_expired_instead_of_cancelled()
    {
        var invitation = New();

        invitation.Cancel(Made.AddDays(8)).Should().BeFalse();
        invitation.StatusAt(Made.AddDays(8)).Should().Be(InvitationStatus.Expired);
    }

    [Fact]
    public void A_familys_link_is_for_its_family_and_lasts_seven_days_too()
    {
        var familyId = Guid.CreateVersion7();
        var invitation = Invitation.Create(new byte[32], "Mom", Guid.CreateVersion7(), Made, familyId);

        invitation.FamilyId.Should().Be(familyId);
        invitation.ExpiresAt.Should().Be(Made.AddDays(7));
        invitation.CreatedAccount.Should().BeFalse();
        New().FamilyId.Should().BeNull();
    }
}
