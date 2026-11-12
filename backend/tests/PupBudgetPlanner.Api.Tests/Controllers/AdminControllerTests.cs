using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Domain.Invitations;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class AdminControllerTests
{
    private static readonly Guid AdminId = Guid.CreateVersion7();

    private readonly IPeopleService people = Substitute.For<IPeopleService>();
    private readonly IInvitationService invitations = Substitute.For<IInvitationService>();
    private readonly AdminController controller;

    public AdminControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var admin = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, AdminId.ToString())], "cookie"));
        controller = new AdminController(people, invitations)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider(), User = admin },
            },
        };
    }

    private static PeopleRequest Two() => new([Guid.CreateVersion7(), Guid.CreateVersion7()]);

    [Fact]
    public void Only_the_admin_reaches_it()
    {
        typeof(AdminController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Should().ContainSingle().Which.Should().BeOfType<AuthorizeAttribute>()
            .Which.Policy.Should().Be(AdminPolicy.Name);
    }

    [Fact]
    public async Task People_lists_everyone_for_the_signed_in_admin()
    {
        IReadOnlyList<PersonItem> list = [new(AdminId, "Yulia", "yulia@example.com", DateTimeOffset.UtcNow, true, true, false, null, null)];
        people.ListAsync(AdminId, Arg.Any<CancellationToken>()).Returns(list);

        var result = await controller.People(CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(list);
    }

    [Theory]
    [InlineData(PeopleActionOutcome.Done, StatusCodes.Status204NoContent)]
    [InlineData(PeopleActionOutcome.IncludesYou, StatusCodes.Status400BadRequest)]
    [InlineData(PeopleActionOutcome.NotFound, StatusCodes.Status404NotFound)]
    public async Task Block_unblock_and_delete_map_outcomes_to_status_codes(PeopleActionOutcome outcome, int status)
    {
        people.BlockAsync(AdminId, Arg.Any<PeopleRequest>(), Arg.Any<CancellationToken>()).Returns(outcome);
        people.UnblockAsync(AdminId, Arg.Any<PeopleRequest>(), Arg.Any<CancellationToken>()).Returns(outcome);
        people.DeleteAsync(AdminId, Arg.Any<PeopleRequest>(), Arg.Any<CancellationToken>()).Returns(outcome);

        foreach (var result in new[]
                 {
                     await controller.Block(Two(), CancellationToken.None),
                     await controller.Unblock(Two(), CancellationToken.None),
                     await controller.Delete(Two(), CancellationToken.None),
                 })
        {
            (result as IStatusCodeActionResult)!.StatusCode.Should().Be(status);
        }
    }

    [Fact]
    public async Task A_new_link_is_made_by_the_signed_in_admin_and_returned_once()
    {
        var created = new CreatedInvitation(Guid.CreateVersion7(), "the-token", "For Mom", DateTimeOffset.UtcNow.AddDays(7));
        invitations.CreateAsync(AdminId, Arg.Any<CreateInvitationRequest>(), Arg.Any<CancellationToken>()).Returns(created);

        var result = await controller.CreateInvitation(new CreateInvitationRequest("For Mom"), CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(created);
    }

    [Theory]
    [InlineData(CancelInvitationOutcome.Cancelled, StatusCodes.Status204NoContent)]
    [InlineData(CancelInvitationOutcome.NotFound, StatusCodes.Status404NotFound)]
    [InlineData(CancelInvitationOutcome.NotWaiting, StatusCodes.Status409Conflict)]
    public async Task Cancelling_a_link_maps_outcomes_to_status_codes(CancelInvitationOutcome outcome, int status)
    {
        invitations.CancelAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(outcome);

        var result = await controller.CancelInvitation(Guid.CreateVersion7(), CancellationToken.None);

        (result as IStatusCodeActionResult)!.StatusCode.Should().Be(status);
    }

    [Fact]
    public async Task Invitations_lists_the_links()
    {
        IReadOnlyList<InvitationItem> list =
            [new(Guid.CreateVersion7(), "For Mom", InvitationStatus.Waiting, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(7), null, null, null)];
        invitations.ListAsync(Arg.Any<CancellationToken>()).Returns(list);

        var result = await controller.Invitations(CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(list);
    }

    [Fact]
    public async Task Picked_links_are_deleted_or_cancelled_and_the_answer_says_how_many()
    {
        var request = new InvitationsRequest([Guid.CreateVersion7(), Guid.CreateVersion7(), Guid.CreateVersion7()]);
        invitations.DeleteAsync(request, Arg.Any<CancellationToken>()).Returns(new InvitationsChanged(3));
        invitations.CancelManyAsync(request, Arg.Any<CancellationToken>()).Returns(new InvitationsChanged(1));

        (await controller.DeleteInvitations(request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new InvitationsChanged(3));
        (await controller.CancelInvitations(request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new InvitationsChanged(1));
    }
}

public sealed class InvitationsControllerTests
{
    private readonly IInvitationService invitations = Substitute.For<IInvitationService>();
    private readonly InvitationsController controller;

    public InvitationsControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        controller = new InvitationsController(invitations)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() },
            },
        };
    }

    [Fact]
    public async Task A_working_link_shows_who_invited_and_until_when()
    {
        var preview = new InvitationPreview("Yulia", DateTimeOffset.UtcNow.AddDays(5));
        invitations.PreviewAsync("the-token", Arg.Any<CancellationToken>()).Returns(preview);

        var result = await controller.Preview("the-token", CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(preview);
    }

    [Fact]
    public async Task A_link_that_does_not_work_gets_one_neutral_404()
    {
        invitations.PreviewAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((InvitationPreview?)null);

        var result = await controller.Preview("used-token", CancellationToken.None);

        var problem = result.Result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        problem.Value.Should().BeOfType<ProblemDetails>().Which.Title.Should().Be(AuthController.InvitationGoneTitle);
    }

    [Fact]
    public async Task A_token_that_is_far_too_long_is_not_looked_up()
    {
        var result = await controller.Preview(new string('a', 500), CancellationToken.None);

        (result.Result as ObjectResult)!.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        await invitations.DidNotReceive().PreviewAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public void It_is_open_without_signing_in_and_rate_limited()
    {
        typeof(InvitationsController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).Should().ContainSingle();
        typeof(InvitationsController).GetMethod(nameof(InvitationsController.Preview))!
            .GetCustomAttributes(typeof(EnableRateLimitingAttribute), inherit: false)
            .Should().ContainSingle().Which.Should().BeOfType<EnableRateLimitingAttribute>()
            .Which.PolicyName.Should().Be(AuthRateLimiting.PolicyName);
    }
}

public sealed class AdminRequirementHandlerTests
{
    [Theory]
    [InlineData("yulia@example.com", true)]
    [InlineData("vlad@example.com", false)]
    [InlineData(null, false)]
    public async Task Only_an_admin_email_passes(string? email, bool passes)
    {
        var access = new AccessOptions();
        access.AdminEmails.Add("yulia@example.com");
        var monitor = Substitute.For<IOptionsMonitor<AccessOptions>>();
        monitor.CurrentValue.Returns(access);
        var claims = email is null ? [] : new[] { new Claim(ClaimTypes.Email, email) };
        var requirement = new AdminRequirement();
        var context = new AuthorizationHandlerContext(
            [requirement], new ClaimsPrincipal(new ClaimsIdentity(claims, "cookie")), null);

        await new AdminRequirementHandler(monitor).HandleAsync(context);

        context.HasSucceeded.Should().Be(passes);
    }
}
