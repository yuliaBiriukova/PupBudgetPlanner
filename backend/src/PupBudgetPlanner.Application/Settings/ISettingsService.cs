namespace PupBudgetPlanner.Application.Settings;

/// <summary>The person's own settings (F-016). Implemented with ASP.NET Core Identity in Infrastructure.</summary>
public interface ISettingsService
{
    /// <summary>Null when the person has no account (any more).</summary>
    Task<UserSettings?> GetAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>Saves the name; null when the person has no account (any more).</summary>
    Task<UserSettings?> ChangeNameAsync(Guid userId, ChangeNameRequest request, CancellationToken cancellationToken);

    /// <summary>Saves the report currency; null when the person has no account (any more).</summary>
    Task<UserSettings?> ChangeReportCurrencyAsync(
        Guid userId, ChangeReportCurrencyRequest request, CancellationToken cancellationToken);
}
