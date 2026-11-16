using System.Globalization;
using FluentValidation;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain;

namespace PupBudgetPlanner.Application.Budgets;

/// <summary>
/// The months a budget can be planned for: from 2000 (as the reports) to next month, Kyiv's (the Budget page's › stops
/// there).
/// </summary>
public static class BudgetMonths
{
    public const int FirstYear = 2000;

    /// <summary>The month's first day, when <paramref name="month"/> is written <c>yyyy-MM</c>.</summary>
    public static DateOnly? Parse(string? month) =>
        DateOnly.TryParseExact(
            $"{month}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first)
            ? first
            : null;

    public static bool InRange(DateOnly first, TimeProvider clock)
    {
        var today = Kyiv.Today(clock);
        return first.Year >= FirstYear && first <= new DateOnly(today.Year, today.Month, 1).AddMonths(1);
    }

    internal static IRuleBuilderOptions<T, string?> ValidMonth<T>(this IRuleBuilderInitial<T, string?> rule, TimeProvider clock) =>
        rule.Cascade(CascadeMode.Stop)
            .Must(month => Parse(month) is not null).WithMessage("Write the month as yyyy-MM, e.g. 2026-11.")
            .Must(month => InRange(Parse(month)!.Value, clock))
            .WithMessage($"Pick a month from {FirstYear} to next month.");
}

/// <summary>A budget is a whole amount above zero, or none (removed).</summary>
public sealed class SetBudgetRequestValidator : AbstractValidator<SetBudgetRequest>
{
    public SetBudgetRequestValidator(TimeProvider clock)
    {
        RuleFor(r => r.Month).ValidMonth(clock);
        RuleFor(r => r.Amount!.Value).Cascade(CascadeMode.Stop)
            .Must(amount => Money.Whole(amount) > 0).WithMessage("The budget must be more than zero.")
            .Must(amount => Money.Whole(amount) <= SaveAccountRequestValidator.MaxAmount)
            .WithMessage("The budget is too big.")
            .OverridePropertyName(nameof(SetBudgetRequest.Amount))
            .When(r => r.Amount is not null);
    }
}

public sealed class StartMonthRequestValidator : AbstractValidator<StartMonthRequest>
{
    public StartMonthRequestValidator(TimeProvider clock) => RuleFor(r => r.Month).ValidMonth(clock);
}

/// <summary>The month the Budget page asks for.</summary>
public sealed record BudgetMonthQuery(string? Month);

public sealed class BudgetMonthQueryValidator : AbstractValidator<BudgetMonthQuery>
{
    public BudgetMonthQueryValidator(TimeProvider clock) => RuleFor(r => r.Month).ValidMonth(clock);
}
