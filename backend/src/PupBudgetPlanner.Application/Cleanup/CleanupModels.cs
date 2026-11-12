namespace PupBudgetPlanner.Application.Cleanup;

/// <summary>
/// The <c>Cleanup</c> settings of the morning clean-up (I-006, ADR 0033). The secret is set only on Render
/// (<c>Cleanup__Secret</c>) and in user-secrets, never in the repository; without it the clean-up can't be started.
/// </summary>
public sealed class CleanupOptions
{
    public const string SectionName = "Cleanup";

    /// <summary>What the scheduler sends in <c>X-Cleanup-Secret</c>.</summary>
    public string? Secret { get; set; }

    /// <summary>How long a used, expired or cancelled invite link is kept after it stopped working.</summary>
    public TimeSpan InvitationsKeptFor { get; set; } = TimeSpan.FromDays(30);
}

/// <summary>What one run deleted. Other outdated data adds its own count here.</summary>
public sealed record CleanupReport(int InvitationsDeleted);

/// <summary>
/// Deletes outdated data, once every morning (I-006). Running it twice deletes nothing more. Implemented with EF Core in
/// Infrastructure.
/// </summary>
public interface ICleanupService
{
    Task<CleanupReport> RunAsync(CancellationToken cancellationToken);
}
