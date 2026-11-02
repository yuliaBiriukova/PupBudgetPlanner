using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class TransactionsControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly Guid TransactionId = Guid.CreateVersion7();
    private static readonly Guid AccountId = Guid.CreateVersion7();
    private static readonly Guid CategoryId = Guid.CreateVersion7();

    private static readonly SaveTransactionRequest Request = new(
        TransactionType.Expense, new DateOnly(2026, 11, 1), AccountId, CategoryId, 612m, "Silpo");

    private static readonly SavedTransaction Saved = new(
        new TransactionItem(
            TransactionId, TransactionType.Expense, new DateOnly(2026, 11, 1), AccountId, "Mono black", "UAH",
            CategoryId, "Groceries", 612m, "Silpo"),
        [new BalanceChange(AccountId, 48_211m, 47_599m)]);

    private readonly ITransactionService transactions = Substitute.For<ITransactionService>();
    private readonly TransactionsController controller;

    public TransactionsControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var person = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new TransactionsController(transactions)
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
        typeof(TransactionsController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task The_latest_and_the_suggestions_are_the_signed_in_persons()
    {
        var latest = new LatestTransactions([Saved.Transaction]);
        var suggestions = new TransactionSuggestions([new LastAccount(TransactionType.Expense, AccountId)], [], []);
        transactions.LatestAsync(UserId, Arg.Any<CancellationToken>()).Returns(latest);
        transactions.SuggestionsAsync(UserId, Arg.Any<CancellationToken>()).Returns(suggestions);

        (await controller.Latest(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(latest);
        (await controller.Suggestions(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(suggestions);
    }

    [Fact]
    public async Task A_save_answers_with_the_transaction_and_the_balance_it_changed()
    {
        transactions.CreateAsync(UserId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveTransactionResult(SaveTransactionOutcome.Saved, Saved));
        transactions.UpdateAsync(UserId, TransactionId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveTransactionResult(SaveTransactionOutcome.Saved, Saved));

        (await controller.Create(Request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(Saved);
        (await controller.Update(TransactionId, Request, CancellationToken.None)).Result
            .Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(Saved);
    }

    [Theory]
    [InlineData(SaveTransactionOutcome.NoSuchAccount, "accountId")]
    [InlineData(SaveTransactionOutcome.NoSuchCategory, "categoryId")]
    public async Task Someone_elses_or_an_archived_account_or_category_is_a_bad_request(
        SaveTransactionOutcome outcome, string field)
    {
        transactions.CreateAsync(UserId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveTransactionResult(outcome));

        var result = (await controller.Create(Request, CancellationToken.None)).Result;

        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey(field);
        ((IStatusCodeActionResult)result!).StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Someone_elses_or_a_made_up_transaction_is_not_found()
    {
        transactions.UpdateAsync(UserId, TransactionId, Request, Arg.Any<CancellationToken>())
            .Returns(new SaveTransactionResult(SaveTransactionOutcome.NotFound));
        transactions.DeleteAsync(UserId, TransactionId, Arg.Any<CancellationToken>()).Returns((DeletedTransaction?)null);

        ((IStatusCodeActionResult)(await controller.Update(TransactionId, Request, CancellationToken.None)).Result!)
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
        ((IStatusCodeActionResult)(await controller.Delete(TransactionId, CancellationToken.None)).Result!)
            .StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Delete_answers_with_the_balance_it_gave_back()
    {
        var deleted = new DeletedTransaction([new BalanceChange(AccountId, 47_599m, 48_211m)]);
        transactions.DeleteAsync(UserId, TransactionId, Arg.Any<CancellationToken>()).Returns(deleted);

        (await controller.Delete(TransactionId, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(deleted);
    }
}
