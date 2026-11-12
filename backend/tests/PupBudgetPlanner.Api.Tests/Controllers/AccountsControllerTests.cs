using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Families;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class AccountsControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly Guid AccountId = Guid.CreateVersion7();

    private static readonly SaveAccountRequest Request = new(
        "Wallet", "UAH", SourceKind.Cash, null, null, 1_200m, new DateOnly(2026, 1, 1), CardStyle.Envelope);

    private static readonly AccountItem Item = new(
        AccountId, UserId, "Wallet", "UAH", SourceKind.Cash, null, null, null, null, 1_200m, new DateOnly(2026, 1, 1),
        1_200m, CardStyle.Envelope, null, 0, null, AccountShare.Everything);

    private readonly IAccountService accounts = Substitute.For<IAccountService>();
    private readonly IFamilyService families = Substitute.For<IFamilyService>();
    private readonly AccountsController controller;

    public AccountsControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var person = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new AccountsController(accounts, families)
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
        accounts.OverviewAsync(MoneyScope.Own(UserId), Arg.Any<CancellationToken>()).Returns(overview);
        accounts.CreateAsync(UserId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveAccountResult(SaveAccountOutcome.Saved, Item));

        (await controller.Overview(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(overview);
        (await controller.Create(Request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(Item);
    }

    [Fact]
    public async Task The_total_is_the_signed_in_persons()
    {
        var total = new AccountsTotal(
            "UAH", 52_174m, new DateOnly(2026, 11, 2), RatesStatus.Current, [new RateItem("USD", 41.35m)]);
        accounts.TotalAsync(MoneyScope.Own(UserId), Arg.Any<CancellationToken>()).Returns(total);

        (await controller.Total(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(total);
        await families.DidNotReceiveWithAnyArgs().ScopeAsync(default, default!, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task A_family_members_or_the_familys_accounts_are_the_ones_the_family_lets_you_see()
    {
        var andriy = Guid.CreateVersion7();
        var theirs = new MoneyScope(UserId, [andriy]);
        var together = new MoneyScope(UserId, [UserId, andriy]);
        families.ScopeAsync(UserId, Who.Person(andriy), Arg.Any<CancellationToken>()).Returns(theirs);
        families.ScopeAsync(UserId, Who.Family, Arg.Any<CancellationToken>()).Returns(together);
        var overview = new AccountsOverview([Item], [], [], [], [], Currencies.All);
        var total = new AccountsTotal("UAH", 1_200m, null, RatesStatus.Current, []);
        accounts.OverviewAsync(theirs, Arg.Any<CancellationToken>()).Returns(overview);
        accounts.TotalAsync(together, Arg.Any<CancellationToken>()).Returns(total);

        (await controller.Overview(CancellationToken.None, andriy.ToString())).Result.Should()
            .BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(overview);
        (await controller.Total(CancellationToken.None, "family")).Result.Should()
            .BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(total);
    }

    [Fact]
    public async Task Someone_outside_your_family_is_not_found_and_a_made_up_who_is_a_bad_request()
    {
        var stranger = Guid.CreateVersion7();
        families.ScopeAsync(UserId, Who.Person(stranger), Arg.Any<CancellationToken>()).Returns((MoneyScope?)null);

        (await controller.Overview(CancellationToken.None, stranger.ToString())).Result.Should()
            .BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        (await controller.Total(CancellationToken.None, "everyone")).Result.Should()
            .BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("who");
        await accounts.DidNotReceiveWithAnyArgs().OverviewAsync(default!, TestContext.Current.CancellationToken);
        await accounts.DidNotReceiveWithAnyArgs().TotalAsync(default!, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task Someone_elses_or_a_made_up_account_is_not_found()
    {
        accounts.UpdateAsync(UserId, AccountId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveAccountResult(SaveAccountOutcome.NotFound));
        accounts.ArchiveAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(false);
        accounts.RestoreAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(RestoreAccountOutcome.NotFound);

        ((IStatusCodeActionResult)(await controller.Update(AccountId, Request, CancellationToken.None)).Result!)
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
        ((IStatusCodeActionResult)await controller.Archive(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
        ((IStatusCodeActionResult)await controller.Restore(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Deleting_someone_elses_or_a_made_up_account_is_not_found()
    {
        accounts.DeleteAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(DeleteAccountOutcome.NotFound);

        ((IStatusCodeActionResult)await controller.Delete(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Delete_removes_the_signed_in_persons_account()
    {
        accounts.DeleteAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(DeleteAccountOutcome.Deleted);

        (await controller.Delete(AccountId, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        await accounts.Received(1).DeleteAsync(UserId, AccountId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task An_account_with_transactions_keeps_its_currency_and_cant_be_deleted()
    {
        accounts.UpdateAsync(UserId, AccountId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveAccountResult(SaveAccountOutcome.CurrencyFixed));
        accounts.DeleteAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(DeleteAccountOutcome.HasTransactions);

        ((IStatusCodeActionResult)(await controller.Update(AccountId, Request, CancellationToken.None)).Result!)
            .StatusCode.Should().Be(StatusCodes.Status409Conflict);
        ((IStatusCodeActionResult)await controller.Delete(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Update_archive_and_restore_answer_for_the_persons_account()
    {
        accounts.UpdateAsync(UserId, AccountId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveAccountResult(SaveAccountOutcome.Saved, Item));
        accounts.ArchiveAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(true);
        accounts.RestoreAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(RestoreAccountOutcome.Restored);

        (await controller.Update(AccountId, Request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>();
        (await controller.Archive(AccountId, CancellationToken.None)).Should().BeOfType<NoContentResult>();
        (await controller.Restore(AccountId, CancellationToken.None)).Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task A_copy_of_an_account_in_use_is_a_mistake_in_the_name()
    {
        accounts.CreateAsync(UserId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveAccountResult(SaveAccountOutcome.Copy));

        var problem = (await controller.Create(Request, CancellationToken.None)).Result.Should()
            .BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>().Which;

        problem.Errors.Should().ContainKey("name").WhoseValue.Should().ContainSingle()
            .Which.Should().Be("You already have this account. Give it another name.");
    }

    [Fact]
    public async Task Editing_into_a_copy_is_a_mistake_in_the_name_too()
    {
        accounts.UpdateAsync(UserId, AccountId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveAccountResult(SaveAccountOutcome.Copy));

        var result = (await controller.Update(AccountId, Request, CancellationToken.None)).Result;

        ((IStatusCodeActionResult)result!).StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("name");
    }

    [Fact]
    public async Task Restoring_a_copy_of_an_account_in_use_is_a_conflict()
    {
        accounts.RestoreAsync(UserId, AccountId, Arg.Any<CancellationToken>()).Returns(RestoreAccountOutcome.Copy);

        ((IStatusCodeActionResult)await controller.Restore(AccountId, CancellationToken.None))
            .StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
}
