using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Api.Tests.Controllers;

/// <summary>What the family sees of the signed-in person's money (F-030).</summary>
public sealed class FamilyPrivacyControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();

    private readonly IFamilyPrivacyService privacy = Substitute.For<IFamilyPrivacyService>();
    private readonly FamilyPrivacyController controller;

    public FamilyPrivacyControllerTests()
    {
        var person = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new FamilyPrivacyController(privacy)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = person } },
        };
    }

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(FamilyPrivacyController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task Each_person_sets_their_own()
    {
        var accountId = Guid.CreateVersion7();
        var categoryId = Guid.CreateVersion7();
        privacy.ShareAccountAsync(UserId, accountId, AccountShare.Hidden, Arg.Any<CancellationToken>()).Returns(true);
        privacy.KeepCategoryAsync(UserId, categoryId, true, Arg.Any<CancellationToken>()).Returns(true);

        (await controller.ShareTransactions(new ShareTransactionsRequest(TransactionShare.Totals), CancellationToken.None))
            .Should().BeOfType<NoContentResult>();
        (await controller.ShareAccount(accountId, new ShareAccountRequest(AccountShare.Hidden), CancellationToken.None))
            .Should().BeOfType<NoContentResult>();
        (await controller.KeepCategory(categoryId, new KeepCategoryRequest(true), CancellationToken.None))
            .Should().BeOfType<NoContentResult>();

        await privacy.Received(1).ShareTransactionsAsync(UserId, TransactionShare.Totals, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Someone_elses_account_or_category_is_not_found()
    {
        var someoneElses = Guid.CreateVersion7();

        (await controller.ShareAccount(someoneElses, new ShareAccountRequest(AccountShare.Hidden), CancellationToken.None))
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        (await controller.KeepCategory(someoneElses, new KeepCategoryRequest(true), CancellationToken.None))
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        (await controller.KeepGroup(someoneElses, new KeepCategoryRequest(true), CancellationToken.None))
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task A_whole_group_is_kept_for_the_signed_in_person()
    {
        var groupId = Guid.CreateVersion7();
        privacy.KeepGroupAsync(UserId, groupId, true, Arg.Any<CancellationToken>()).Returns(true);

        (await controller.KeepGroup(groupId, new KeepCategoryRequest(true), CancellationToken.None))
            .Should().BeOfType<NoContentResult>();
    }
}
