using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.ExchangeRates;

/// <summary>
/// The currency totals and reports are shown in. Each person picks theirs in Settings (F-016); this is the one a new
/// account starts with.
/// </summary>
public static class ReportCurrency
{
    public const string Default = Currencies.Hryvnia;
}
