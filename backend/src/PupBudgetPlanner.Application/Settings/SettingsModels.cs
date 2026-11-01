namespace PupBudgetPlanner.Application.Settings;

/// <summary>
/// The signed-in person's settings (F-016). The email can't be changed yet. The theme isn't here: it is kept on each
/// device, so a phone can be dark while the laptop is light.
/// </summary>
public sealed record UserSettings(string DisplayName, string Email, string ReportCurrency);

/// <summary>The name the person and their family see; saved trimmed.</summary>
public sealed record ChangeNameRequest(string DisplayName);

/// <summary>
/// The currency totals and reports are shown in: the hryvnia, or any other currency the NBU publishes a rate for.
/// </summary>
public sealed record ChangeReportCurrencyRequest(string Currency);
