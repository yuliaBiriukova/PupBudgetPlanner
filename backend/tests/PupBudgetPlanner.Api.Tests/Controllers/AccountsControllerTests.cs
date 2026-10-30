using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class AccountsControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly Guid AccountId = Guid.CreateVersion7();

    private static readonly SaveAccountRequest Request = new(
        "Wallet", "UAH", SourceKind.Cash, null, null, 1_200m, new DateOnly(2026, 1, 1), CardStyle.Envelope);

    private static readonly AccountItem Item = new(
        AccountId, "Wallet", "UAH", SourceKind.Cash, null, null, null, null, 1_200m, new DateOnly(2026, 1, 1),
        1_200m, CardStyle.Envelope, null);

    private readonly IAccountService accounts = Substitute.For<IAccountService>();
    private readonly AccountsController controller;

    public AccountsControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var person = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new AccountsController(accounts)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider(), User = person },
            },
        };
    }

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(AccountsController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).Should().BeEmpty();
    }

    [Fact]
    public async Task Overview_and_create_work_on_the_signed_in_persons_accounts()
    {
        var overview = new AccountsOverview([Item], [], [new CurrencyTotal("UAH", 1, 1_200m)], [], [], Currencies.All);
        accounts.OverviewAsync(UserId, Arg.Any<CancellationToken>()).Returns(overview);
        accounts.CreateAsync(UserId, Request, Arg.Any<CancellationToken>()).Returns(Item);

        (await controller.Overview(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(overview);
        (await controller.Create(Request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(Item);
    }

    [Fact]
    public async Task Someone_elses_or_a_made_up_account_is_not_found()
    {
        accounts.UpdateAsync(UserId, AccountId, Request, Arg.Any<CancellationToken>()).Returns((AccountItem?)null);
        accounts.ArchiveAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(false);
        accounts.RestoreAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(false);

        ((IStatusCodeActionResult)(await controller.Update(AccountId, Request, CancellationToken.None)).Result!)
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
        ((IStatusCodeActionResult)await controller.Archive(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
        ((IStatusCodeActionResult)await controller.Restore(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Update_archive_and_restore_answer_for_the_persons_account()
    {
        accounts.UpdateAsync(UserId, AccountId, Request, Arg.Any<CancellationToken>()).Returns(Item);
        accounts.ArchiveAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(true);
        accounts.RestoreAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(true);

        (await controller.Update(AccountId, Request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>();
        (await controller.Archive(AccountId, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        (await controller.Restore(AccountId, CancellationToken.None)).Should().BeOfType<NoContentResult>();
    }
}
