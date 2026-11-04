namespace PupBudgetPlanner.Application.Reports;

/// <summary>The person's reports (F-021): loads what <see cref="ReportBuilder"/> needs. Implemented in Infrastructure.</summary>
public interface IReportService
{
    /// <summary>
    /// The report of <paramref name="period"/> in <paramref name="currency"/>, or in the person's report currency
    /// (Settings, F-016) without one.
    /// </summary>
    Task<Report> ReportAsync(
        Guid userId, ReportPeriod period, string? currency, CancellationToken cancellationToken);
}
