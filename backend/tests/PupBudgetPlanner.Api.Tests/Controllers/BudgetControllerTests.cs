using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Application.Reminders;
using PupBudgetPlanner.Domain.Budgets;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class BudgetControllerTests
{
    private static readonly Guid Person = Guid.CreateVersion7();
    private static readonly Guid Group = Guid.CreateVersion7();
    private static readonly DateOnly November = new(2026, 11, 1);

    /// <summary>16 November 2026 in Kyiv.</summary>
    private sealed class MidNovember : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 16, 10, 0, 0, TimeSpan.Zero);
    }

    private readonly IBudgetService budgets = Substitute.For<IBudgetService>();
    private readonly BudgetController controller;

    public BudgetControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        controller = new BudgetController(budgets, new BudgetMonthQueryValidator(new MidNovember()))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    RequestServices = services.BuildServiceProvider(),
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, Person.ToString())], "Test")),
                },
            },
        };
    }

    [Fact]
    public async Task The_month_asked_for_is_the_signed_in_persons()
    {
        var month = new MonthBudget("2026-11", "UAH", true, null, 50_000, 120, [], false, 0, [], new SavedMoney(0, 0, 0));
        budgets.MonthAsync(Person, November, Arg.Any<CancellationToken>()).Returns(month);

        var result = await controller.Month("2026-11", CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(month);
    }

    [Fact]
    public async Task A_month_after_next_is_a_mistake_in_the_month()
    {
        var result = await controller.Month("2027-01", CancellationToken.None);

        result.Result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("month");
        await budgets.DidNotReceive().MonthAsync(Arg.Any<Guid>(), Arg.Any<DateOnly>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Deleting_a_months_plan_deletes_the_signed_in_persons()
    {
        budgets.DeleteAsync(Person, November, Arg.Any<CancellationToken>()).Returns(BudgetResult.Done);

        var result = await controller.Delete("2026-11", CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Deleting_a_month_not_planned_is_not_found()
    {
        budgets.DeleteAsync(Person, November, Arg.Any<CancellationToken>())
            .Returns(new BudgetResult(BudgetOutcome.NotPlanned));

        var result = await controller.Delete("2026-11", CancellationToken.None);

        result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Deleting_needs_a_month()
    {
        var result = await controller.Delete(null, CancellationToken.None);

        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors.Should().ContainKey("month");
        await budgets.DidNotReceive().DeleteAsync(Arg.Any<Guid>(), Arg.Any<DateOnly>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_budget_that_doesnt_fit_says_what_goes_over_and_by_how_much()
    {
        budgets.SetGroupAsync(Person, November, Group, 9_000, Arg.Any<CancellationToken>())
            .Returns(new BudgetResult(BudgetOutcome.Overflow, new BudgetOverflow(Group, 10_500, 9_000)));

        var result = await controller.SetGroup(Group, new SetBudgetRequest("2026-11", 9_000), CancellationToken.None);

        result.Should().BeAssignableTo<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Which.Errors["amount"].Should().Equal(
                "Its categories add up to 10,500, 1,500 more than the group's 9,000.");
    }

    [Fact]
    public void The_total_going_over_names_the_groups()
    {
        BudgetController.OverflowText(new BudgetOverflow(null, 51_000, 50_000))
            .Should().Be("The groups add up to 51,000, 1,000 more than the month's total of 50,000.");
    }

    [Fact]
    public void The_total_going_over_with_jars_planned_names_the_jars_too()
    {
        BudgetController.OverflowText(new BudgetOverflow(null, 51_000, 50_000, 6_000))
            .Should().Be("The groups and jars add up to 51,000, 1,000 more than the month's total of 50,000.");
    }

    [Fact]
    public async Task A_jar_planned_is_the_signed_in_persons_and_one_not_theirs_not_found()
    {
        var jar = Guid.CreateVersion7();
        budgets.SetJarAsync(Person, November, jar, 5_000, Arg.Any<CancellationToken>()).Returns(BudgetResult.Done);
        budgets.SetJarAsync(Person, November, Group, 5_000, Arg.Any<CancellationToken>())
            .Returns(new BudgetResult(BudgetOutcome.NotFound));

        (await controller.SetJar(jar, new SetBudgetRequest("2026-11", 5_000), CancellationToken.None))
            .Should().BeOfType<NoContentResult>();
        (await controller.SetJar(Group, new SetBudgetRequest("2026-11", 5_000), CancellationToken.None))
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task A_change_saved_is_no_content_and_an_unknown_category_not_found()
    {
        var category = Guid.CreateVersion7();
        budgets.SetCategoryAsync(Person, November, category, 500, Arg.Any<CancellationToken>())
            .Returns(BudgetResult.Done);
        budgets.SetCategoryAsync(Person, November, Group, 500, Arg.Any<CancellationToken>())
            .Returns(new BudgetResult(BudgetOutcome.NotFound));

        (await controller.SetCategory(category, new SetBudgetRequest("2026-11", 500), CancellationToken.None))
            .Should().BeOfType<NoContentResult>();
        (await controller.SetCategory(Group, new SetBudgetRequest("2026-11", 500), CancellationToken.None))
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Starting_a_month_planned_already_is_a_conflict()
    {
        budgets.StartAsync(Person, November, true, Arg.Any<CancellationToken>())
            .Returns(new BudgetResult(BudgetOutcome.AlreadyPlanned));

        var result = await controller.Start(new StartMonthRequest("2026-11", true), CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task The_reminder_runs_only_with_its_secret()
    {
        var reminders = Substitute.For<IBudgetReminderService>();
        reminders.RunAsync(Arg.Any<CancellationToken>()).Returns(new ReminderReport(3, 1, 0));
        var options = Substitute.For<IOptionsMonitor<PushOptions>>();
        options.CurrentValue.Returns(new PushOptions { RemindersSecret = "a-long-random-secret" });
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var job = new BudgetRemindersController(reminders, options, NullLogger<BudgetRemindersController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() },
            },
        };

        (await job.Run("a-long-random-secret", CancellationToken.None)).Result
            .Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(new ReminderReport(3, 1, 0));
        (await job.Run("wrong", CancellationToken.None)).Result
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        await reminders.Received(1).RunAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public void The_public_key_is_given_only_when_push_is_set_up()
    {
        var options = Substitute.For<IOptionsMonitor<PushOptions>>();
        var push = new PushController(Substitute.For<IPushSubscriptionService>(), options);

        options.CurrentValue.Returns(new PushOptions { PublicKey = "BPublic" });
        push.Key().Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(new PushKey(null));

        options.CurrentValue.Returns(new PushOptions { PublicKey = "BPublic", PrivateKey = "private" });
        push.Key().Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(new PushKey("BPublic"));
    }
}
