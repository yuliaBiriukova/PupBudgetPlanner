using PupBudgetPlanner.Application.Families;

namespace PupBudgetPlanner.Application.Reports;

/// <summary>The person's reports (F-021): loads what <see cref="ReportBuilder"/> needs. Implemented in Infrastructure.</summary>
public interface IReportService
{
    /// <summary>
    /// The report of <paramref name="period"/> in <paramref name="currency"/>, or in the viewer's report currency
    /// (Settings, F-016) without one: the money of the people in <paramref name="scope"/> (F-024), together with
    /// categories of the same group and name as one.
    /// </summary>
    Task<Report> ReportAsync(
        MoneyScope scope, ReportPeriod period, string? currency, CancellationToken cancellationToken);
}
