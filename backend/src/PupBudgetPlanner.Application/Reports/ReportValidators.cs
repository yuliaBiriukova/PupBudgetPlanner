using System.Globalization;
using FluentValidation;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.Reports;

/// <summary>The yearly report's query: <c>?year=2026</c>, and a currency other than the report currency.</summary>
public sealed record YearReportQuery(int Year, string? Currency = null);

/// <summary>The monthly report's query: <c>?month=2026-10</c>, and a currency other than the report currency.</summary>
public sealed record MonthReportQuery(string? Month, string? Currency = null)
{
    /// <summary>The month's first day, when <see cref="Month"/> is written <c>yyyy-MM</c>.</summary>
    public DateOnly? First =>
        DateOnly.TryParseExact(
            $"{Month}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first)
            ? first
            : null;
}

/// <summary>Reports start in 2000 and stop at Kyiv's today: no transaction is after it.</summary>
public static class ReportLimits
{
    public const int FirstYear = 2000;
}

public sealed class YearReportQueryValidator : AbstractValidator<YearReportQuery>
{
    public YearReportQueryValidator(TimeProvider clock)
    {
        RuleFor(query => query.Year)
            .Must(year => year >= ReportLimits.FirstYear && year <= Kyiv.Today(clock).Year)
            .WithMessage($"Pick a year from {ReportLimits.FirstYear} to this one.");
        RuleFor(query => query.Currency)
            .Must(Currencies.IsKnown).WithMessage("Pick a currency from the list.")
            .When(query => query.Currency is not null);
    }
}

public sealed class MonthReportQueryValidator : AbstractValidator<MonthReportQuery>
{
    public MonthReportQueryValidator(TimeProvider clock)
    {
        RuleFor(query => query.Month).Cascade(CascadeMode.Stop)
            .Must((query, _) => query.First is not null).WithMessage("Write the month as yyyy-MM, e.g. 2026-10.")
            .Must((query, _) =>
                query.First!.Value.Year >= ReportLimits.FirstYear && query.First.Value <= Kyiv.Today(clock))
            .WithMessage($"Pick a month from {ReportLimits.FirstYear} to this one.");
        RuleFor(query => query.Currency)
            .Must(Currencies.IsKnown).WithMessage("Pick a currency from the list.")
            .When(query => query.Currency is not null);
    }
}
