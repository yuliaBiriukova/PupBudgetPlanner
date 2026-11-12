using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Domain.Invitations;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class FamilyControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();

    private readonly IFamilyService families = Substitute.For<IFamilyService>();
    private readonly FamilyController controller;

    public FamilyControllerTests()
    {
        var person = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new FamilyController(families)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = person } },
        };
    }

    private static int? StatusOf(IActionResult result) => result switch
    {
        NoContentResult => StatusCodes.Status204NoContent,
        ObjectResult objectResult => objectResult.StatusCode,
        _ => null,
    };

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(FamilyController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task Get_returns_the_signed_in_persons_family()
    {
        var family = new FamilyView(Guid.CreateVersion7(), "Kovalenko", DateTimeOffset.UnixEpoch, true, []);
        families.GetAsync(UserId, Arg.Any<CancellationToken>()).Returns(family);

        (await controller.Get(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(family);
    }

    [Fact]
    public async Task Get_says_204_to_someone_in_no_family()
    {
        families.GetAsync(UserId, Arg.Any<CancellationToken>()).Returns((FamilyView?)null);

        (await controller.Get(CancellationToken.None)).Result.Should().BeOfType<NoContentResult>();
    }

    [Theory]
    [InlineData(FamilyActionOutcome.Done, StatusCodes.Status204NoContent)]
    [InlineData(FamilyActionOutcome.NoFamily, StatusCodes.Status404NotFound)]
    [InlineData(FamilyActionOutcome.AlreadyInFamily, StatusCodes.Status409Conflict)]
    [InlineData(FamilyActionOutcome.NotOwner, StatusCodes.Status403Forbidden)]
    [InlineData(FamilyActionOutcome.NotFound, StatusCodes.Status404NotFound)]
    [InlineData(FamilyActionOutcome.NotWaiting, StatusCodes.Status409Conflict)]
    [InlineData(FamilyActionOutcome.IsOwner, StatusCodes.Status409Conflict)]
    [InlineData(FamilyActionOutcome.NewOwnerNeeded, StatusCodes.Status400BadRequest)]
    [InlineData(FamilyActionOutcome.InvitationGone, StatusCodes.Status410Gone)]
    public async Task Each_outcome_has_its_status(FamilyActionOutcome outcome, int status)
    {
        var request = new JoinFamilyRequest("k7x9f2qa");
        families.JoinAsync(UserId, request, Arg.Any<CancellationToken>()).Returns(outcome);

        StatusOf(await controller.Join(request, CancellationToken.None)).Should().Be(status);
    }

    [Fact]
    public async Task Every_change_is_made_for_the_signed_in_person()
    {
        var memberId = Guid.CreateVersion7();
        var linkId = Guid.CreateVersion7();
        var done = FamilyActionOutcome.Done;
        families.StartAsync(Arg.Any<Guid>(), Arg.Any<StartFamilyRequest>(), Arg.Any<CancellationToken>()).Returns(done);
        families.RenameAsync(Arg.Any<Guid>(), Arg.Any<RenameFamilyRequest>(), Arg.Any<CancellationToken>()).Returns(done);
        families.CancelInvitationAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(done);
        families.RemoveAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(done);
        families.LeaveAsync(Arg.Any<Guid>(), Arg.Any<LeaveFamilyRequest>(), Arg.Any<CancellationToken>()).Returns(done);

        StatusOf(await controller.Start(new StartFamilyRequest("Kovalenko"), CancellationToken.None)).Should().Be(204);
        StatusOf(await controller.Rename(new RenameFamilyRequest("Melnyk"), CancellationToken.None)).Should().Be(204);
        StatusOf(await controller.CancelInvitation(linkId, CancellationToken.None)).Should().Be(204);
        StatusOf(await controller.Remove(memberId, CancellationToken.None)).Should().Be(204);
        StatusOf(await controller.Leave(new LeaveFamilyRequest(memberId), CancellationToken.None)).Should().Be(204);

        await families.Received(1).StartAsync(UserId, Arg.Any<StartFamilyRequest>(), Arg.Any<CancellationToken>());
        await families.Received(1).RenameAsync(UserId, Arg.Any<RenameFamilyRequest>(), Arg.Any<CancellationToken>());
        await families.Received(1).CancelInvitationAsync(UserId, linkId, Arg.Any<CancellationToken>());
        await families.Received(1).RemoveAsync(UserId, memberId, Arg.Any<CancellationToken>());
        await families.Received(1).LeaveAsync(
            UserId, Arg.Is<LeaveFamilyRequest>(r => r.NewOwnerId == memberId), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_new_link_is_returned_once()
    {
        var request = new CreateInvitationRequest("Mom");
        var made = new CreatedInvitation(Guid.CreateVersion7(), "k7x9f2qa", "Mom", DateTimeOffset.UnixEpoch);
        families.InviteAsync(UserId, request, Arg.Any<CancellationToken>()).Returns((FamilyActionOutcome.Done, made));

        (await controller.Invite(request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(made);
    }

    [Fact]
    public async Task The_owner_lists_deletes_and_cancels_the_familys_links()
    {
        IReadOnlyList<InvitationItem> links =
            [new(Guid.CreateVersion7(), "Mom", InvitationStatus.Used, DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch, null, "Iryna", null, "Kovalenko")];
        var request = new InvitationsRequest([links[0].Id]);
        families.InvitationsAsync(UserId, Arg.Any<CancellationToken>()).Returns((FamilyActionOutcome.Done, links));
        families.DeleteInvitationsAsync(UserId, request, Arg.Any<CancellationToken>())
            .Returns((FamilyActionOutcome.Done, new InvitationsChanged(1)));
        families.CancelInvitationsAsync(UserId, request, Arg.Any<CancellationToken>())
            .Returns((FamilyActionOutcome.Done, new InvitationsChanged(0)));

        (await controller.Invitations(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(links);
        (await controller.DeleteInvitations(request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new InvitationsChanged(1));
        (await controller.CancelInvitations(request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new InvitationsChanged(0));
    }

    [Theory]
    [InlineData(FamilyActionOutcome.NotOwner, StatusCodes.Status403Forbidden)]
    [InlineData(FamilyActionOutcome.NoFamily, StatusCodes.Status404NotFound)]
    public async Task Someone_who_isnt_the_owner_gets_no_links_and_changes_none(FamilyActionOutcome outcome, int status)
    {
        var request = new InvitationsRequest([Guid.CreateVersion7()]);
        families.InvitationsAsync(UserId, Arg.Any<CancellationToken>())
            .Returns((outcome, (IReadOnlyList<InvitationItem>)[]));
        families.DeleteInvitationsAsync(UserId, request, Arg.Any<CancellationToken>())
            .Returns((outcome, new InvitationsChanged(0)));
        families.CancelInvitationsAsync(UserId, request, Arg.Any<CancellationToken>())
            .Returns((outcome, new InvitationsChanged(0)));

        ((await controller.Invitations(CancellationToken.None)).Result as ObjectResult)!.StatusCode.Should().Be(status);
        ((await controller.DeleteInvitations(request, CancellationToken.None)).Result as ObjectResult)!
            .StatusCode.Should().Be(status);
        ((await controller.CancelInvitations(request, CancellationToken.None)).Result as ObjectResult)!
            .StatusCode.Should().Be(status);
    }

    [Fact]
    public async Task Only_the_owner_gets_a_new_link()
    {
        var request = new CreateInvitationRequest(null);
        families.InviteAsync(UserId, request, Arg.Any<CancellationToken>())
            .Returns((FamilyActionOutcome.NotOwner, (CreatedInvitation?)null));

        (await controller.Invite(request, CancellationToken.None)).Result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }
}
