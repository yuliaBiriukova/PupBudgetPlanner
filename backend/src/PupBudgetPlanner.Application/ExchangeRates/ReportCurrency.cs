using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.ExchangeRates;

/// <summary>The currency totals and reports are shown in: the hryvnia for everyone until F-016 lets people choose.</summary>
public static class ReportCurrency
{
    public const string Default = Currencies.Hryvnia;
}
