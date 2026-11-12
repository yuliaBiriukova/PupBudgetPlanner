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

    /// <summary>Using a link is one UPDATE in the database (FamilyCleanup), so a test sets the date by hand.</summary>
    private static Invitation UsedOn(DateTimeOffset usedAt)
    {
        var invitation = New();
        typeof(Invitation).GetProperty(nameof(Invitation.UsedAt))!.SetValue(invitation, usedAt);
        return invitation;
    }

    private static Invitation CancelledOn(DateTimeOffset cancelledAt)
    {
        var invitation = New();
        invitation.Cancel(cancelledAt);
        return invitation;
    }

    [Fact]
    public void It_stops_working_when_used_cancelled_or_expired()
    {
        var now = Made.AddDays(20);

        New().StoppedAt(Made.AddDays(1)).Should().BeNull();
        UsedOn(Made.AddDays(2)).StoppedAt(now).Should().Be(Made.AddDays(2));
        CancelledOn(Made.AddDays(3)).StoppedAt(now).Should().Be(Made.AddDays(3));
        New().StoppedAt(now).Should().Be(Made.AddDays(7));
    }

    [Fact]
    public void The_clean_ups_query_finds_the_links_that_stopped_working_before_the_cutoff()
    {
        var cutoff = Made.AddDays(5);
        var stoppedBefore = Invitation.StoppedBefore(cutoff).Compile();

        stoppedBefore(UsedOn(Made.AddDays(4))).Should().BeTrue();
        stoppedBefore(UsedOn(Made.AddDays(5))).Should().BeFalse("a link that stopped at the cutoff is kept that day");
        stoppedBefore(CancelledOn(Made.AddDays(1))).Should().BeTrue();
        stoppedBefore(CancelledOn(Made.AddDays(6))).Should().BeFalse();
        stoppedBefore(New()).Should().BeFalse("it expires on day 7, after the cutoff");
        Invitation.StoppedBefore(Made.AddDays(8)).Compile()(New()).Should().BeTrue("it expired on day 7");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    [InlineData(6)]
    public void The_query_and_the_date_agree(int day)
    {
        var now = Made.AddDays(40);
        var cutoff = Made.AddDays(day);

        foreach (var invitation in new[] { New(), UsedOn(Made.AddDays(2)), CancelledOn(Made.AddDays(4)) })
        {
            Invitation.StoppedBefore(cutoff).Compile()(invitation)
                .Should().Be(invitation.StoppedAt(now) < cutoff);
        }
    }
}
