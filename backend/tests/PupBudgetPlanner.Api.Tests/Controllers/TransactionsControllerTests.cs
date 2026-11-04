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
        controller = new TransactionsController(transactions, new TransactionFilterValidator())
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
    public async Task The_list_its_summary_and_the_suggestions_are_the_signed_in_persons()
    {
        var filter = new TransactionFilter(new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 31), AccountId);
        var page = new TransactionPage([Saved.Transaction], 30);
        var summary = new TransactionSummary("UAH", 612m, 0m, 1, [], [], false);
        var suggestions = new TransactionSuggestions([new LastAccount(TransactionType.Expense, AccountId)], [], []);
        transactions.ListAsync(UserId, filter, 0, 30, Arg.Any<CancellationToken>()).Returns(page);
        transactions.SummaryAsync(UserId, filter, Arg.Any<CancellationToken>()).Returns(summary);
        transactions.SuggestionsAsync(UserId, Arg.Any<CancellationToken>()).Returns(suggestions);

        (await controller.List(CancellationToken.None, filter.From, filter.To, filter.AccountId))
            .Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(page);
        (await controller.Summary(CancellationToken.None, filter.From, filter.To, filter.AccountId))
            .Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(summary);
        (await controller.Suggestions(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(suggestions);
    }

    [Theory]
    [InlineData(-1, 30, "offset")]
    [InlineData(0, 0, "limit")]
    [InlineData(0, 101, "limit")]
    public async Task A_page_out_of_range_is_a_bad_request(int offset, int limit, string field)
    {
        var result = await controller.List(CancellationToken.None, offset: offset, limit: limit);

        result.Result.Should().BeAssignableTo<ObjectResult>()
            .Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey(field);
        await transactions.DidNotReceiveWithAnyArgs()
            .ListAsync(default, default!, default, default, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task A_period_that_ends_before_it_starts_is_a_bad_request_for_the_list_and_the_summary()
    {
        DateOnly from = new(2026, 10, 31), to = new(2026, 10, 1);

        var list = (await controller.List(CancellationToken.None, from, to)).Result;
        var summary = (await controller.Summary(CancellationToken.None, from, to)).Result;

        list.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("to");
        summary.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("to");
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
    [InlineData(SaveTransactionOutcome.NoSuchToAccount, "toAccountId")]
    [InlineData(SaveTransactionOutcome.ToAmountMissing, "toAmount")]
    public async Task Someone_elses_or_an_archived_account_or_category_or_a_missing_to_amount_is_a_bad_request(
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
