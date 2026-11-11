using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Domain.Tests.Families;

public sealed class FamilyTests
{
    private static readonly DateTimeOffset Started = new(2026, 11, 1, 9, 0, 0, TimeSpan.Zero);
    private static readonly Guid Olena = Guid.CreateVersion7();
    private static readonly Guid Andriy = Guid.CreateVersion7();
    private static readonly Guid Iryna = Guid.CreateVersion7();

    /// <summary>Olena started Kovalenko; Andriy joined a day later, Iryna two days later.</summary>
    private static Family Kovalenko()
    {
        var family = Family.Start(Olena, "Kovalenko", Started);
        family.Join(Andriy, Started.AddDays(1));
        family.Join(Iryna, Started.AddDays(2));
        return family;
    }

    private static IEnumerable<Guid> MembersOf(Family family) => family.Members.Select(m => m.UserId);

    [Fact]
    public void Starting_a_family_makes_its_starter_the_owner_and_only_member()
    {
        var family = Family.Start(Olena, "  Kovalenko ", Started);

        family.Name.Should().Be("Kovalenko");
        family.OwnerId.Should().Be(Olena);
        family.CreatedAt.Should().Be(Started);
        family.Members.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { FamilyId = family.Id, UserId = Olena, JoinedAt = Started });
        family.StartedBy(Olena).Should().BeTrue();
    }

    [Fact]
    public void Someone_who_opens_the_link_joins_once()
    {
        var family = Kovalenko();

        MembersOf(family).Should().Equal(Olena, Andriy, Iryna);
        family.StartedBy(Andriy).Should().BeFalse();
        family.Join(Andriy, Started.AddDays(3)).Should().Be(FamilyOutcome.AlreadyMember);
        family.Members.Should().HaveCount(3);
    }

    [Fact]
    public void Only_the_owner_renames_the_family()
    {
        var family = Kovalenko();

        family.Rename(Andriy, "Melnyk").Should().Be(FamilyOutcome.NotOwner);
        family.Name.Should().Be("Kovalenko");

        family.Rename(Olena, " Kovalenko-Melnyk ").Should().Be(FamilyOutcome.Done);
        family.Name.Should().Be("Kovalenko-Melnyk");
    }

    [Fact]
    public void Only_the_owner_removes_people_and_not_themselves()
    {
        var family = Kovalenko();

        family.Remove(Andriy, Iryna).Should().Be(FamilyOutcome.NotOwner);
        family.Remove(Olena, Olena).Should().Be(FamilyOutcome.IsOwner);
        family.Remove(Olena, Guid.CreateVersion7()).Should().Be(FamilyOutcome.NotMember);
        MembersOf(family).Should().HaveCount(3);

        family.Remove(Olena, Iryna).Should().Be(FamilyOutcome.Done);
        MembersOf(family).Should().Equal(Olena, Andriy);
    }

    [Fact]
    public void A_member_leaves_and_the_family_goes_on()
    {
        var family = Kovalenko();

        family.Leave(Iryna, newOwnerId: null).Should().Be(LeaveOutcome.Left);

        MembersOf(family).Should().Equal(Olena, Andriy);
        family.OwnerId.Should().Be(Olena);
    }

    [Fact]
    public void An_owner_leaving_others_names_who_looks_after_the_family_next()
    {
        var family = Kovalenko();

        family.Leave(Olena, newOwnerId: null).Should().Be(LeaveOutcome.NewOwnerNeeded);
        family.Leave(Olena, Guid.CreateVersion7()).Should().Be(LeaveOutcome.NoSuchNewOwner);
        family.Leave(Olena, Olena).Should().Be(LeaveOutcome.NoSuchNewOwner);
        MembersOf(family).Should().HaveCount(3);

        family.Leave(Olena, Iryna).Should().Be(LeaveOutcome.HandedOver);
        family.OwnerId.Should().Be(Iryna);
        MembersOf(family).Should().Equal(Andriy, Iryna);
    }

    [Fact]
    public void The_last_one_to_leave_empties_the_family()
    {
        var family = Family.Start(Olena, "Kovalenko", Started);

        family.Leave(Olena, newOwnerId: null).Should().Be(LeaveOutcome.Emptied);
        family.Members.Should().BeEmpty();
    }

    [Fact]
    public void Someone_not_in_the_family_cant_leave_it()
    {
        Kovalenko().Leave(Guid.CreateVersion7(), newOwnerId: null).Should().Be(LeaveOutcome.NotMember);
    }

    [Fact]
    public void Deleted_accounts_leave_and_an_owners_family_goes_to_whoever_has_been_in_it_longest()
    {
        var family = Kovalenko();

        family.Lose([Olena]).Should().BeTrue();

        family.OwnerId.Should().Be(Andriy);
        MembersOf(family).Should().Equal(Andriy, Iryna);
    }

    [Fact]
    public void Deleting_a_members_account_keeps_the_owner()
    {
        var family = Kovalenko();

        family.Lose([Andriy]).Should().BeTrue();

        family.OwnerId.Should().Be(Olena);
        MembersOf(family).Should().Equal(Olena, Iryna);
    }

    [Fact]
    public void Deleting_everyones_account_leaves_nobody()
    {
        Kovalenko().Lose([Olena, Andriy, Iryna]).Should().BeFalse();
    }
}
