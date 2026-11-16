using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Application.Reminders;

namespace PupBudgetPlanner.Application.Tests.Budgets;

public sealed class BudgetValidatorTests
{
    /// <summary>30 November 2026, 23:30 in Kyiv (21:30 UTC): next month is December.</summary>
    private sealed class LateInNovember : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 30, 21, 30, 0, TimeSpan.Zero);
    }

    private static readonly LateInNovember Clock = new();

    private readonly SetBudgetRequestValidator setValidator = new(Clock);
    private readonly BudgetMonthQueryValidator monthValidator = new(Clock);

    [Theory]
    [InlineData("2026-11")]
    [InlineData("2026-12")]
    [InlineData("2000-01")]
    public void A_month_from_2000_to_next_month_can_be_planned(string month) =>
        monthValidator.Validate(new BudgetMonthQuery(month)).IsValid.Should().BeTrue();

    [Theory]
    [InlineData(null)]
    [InlineData("2026-13")]
    [InlineData("November")]
    [InlineData("2027-01")]
    [InlineData("1999-12")]
    public void Any_other_month_cant(string? month) =>
        monthValidator.Validate(new BudgetMonthQuery(month)).IsValid.Should().BeFalse();

    [Theory]
    [InlineData(null)]
    [InlineData(1)]
    [InlineData(50_000)]
    public void A_budget_is_none_or_a_whole_amount_above_zero(int? amount) =>
        setValidator.Validate(new SetBudgetRequest("2026-11", amount)).IsValid.Should().BeTrue();

    [Theory]
    [InlineData(0)]
    [InlineData(0.4)]
    [InlineData(-100)]
    public void Zero_or_less_isnt_a_budget(double amount)
    {
        var result = setValidator.Validate(new SetBudgetRequest("2026-11", (decimal)amount));

        result.Errors.Should().ContainSingle().Which.PropertyName.Should().Be("Amount");
    }

    [Theory]
    [InlineData("https://fcm.googleapis.com/fcm/send/abc", true)]
    [InlineData("https://updates.push.services.mozilla.com/wpush/v2/abc", true)]
    [InlineData("https://web.push.apple.com/QGuQ", true)]
    [InlineData("https://wns2-db5p.notify.windows.com/w/?token=abc", true)]
    [InlineData("http://fcm.googleapis.com/fcm/send/abc", false)]
    [InlineData("https://fcm.googleapis.com:8443/fcm/send/abc", false)]
    [InlineData("https://evil.example.com/push.apple.com", false)]
    [InlineData("https://localhost/push", false)]
    public void Only_a_browsers_push_service_over_https_is_a_push_address(string endpoint, bool valid) =>
        SavePushSubscriptionRequestValidator.IsPushService(endpoint).Should().Be(valid);

    [Fact]
    public void The_reminder_says_which_month_to_plan_and_which_to_start_from()
    {
        var message = BudgetReminder.MessageFor(new DateOnly(2026, 12, 1), new DateOnly(2026, 11, 1));

        message.Should().Be(new PushMessage(
            "Plan December's budget", "Start from November's and change what you need.", "/budget"));
        BudgetReminder.MessageFor(new DateOnly(2026, 12, 1), null).Body
            .Should().Be("Set what you can spend this month and see what's left.");
    }
}
