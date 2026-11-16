using System.Globalization;

namespace PupBudgetPlanner.Application.Reminders;

/// <summary>
/// The <c>Push</c> settings (F-033): the app's VAPID key pair (P-256, base64url) and who sends (a <c>mailto:</c> or the
/// app's address), as the push services ask. The private key is set only on Render (<c>Push__PrivateKey</c>) and in
/// user-secrets, never in the repository. Without the keys the reminder is off and Settings says so.
/// </summary>
public sealed class PushOptions
{
    public const string SectionName = "Push";

    /// <summary>The uncompressed public key, 65 bytes; the browser subscribes with it.</summary>
    public string? PublicKey { get; set; }

    /// <summary>The private key, 32 bytes.</summary>
    public string? PrivateKey { get; set; }

    public string Subject { get; set; } = "https://pup-budget-planner.onrender.com";

    /// <summary>What the scheduler sends in <c>X-Reminders-Secret</c> to start the reminder on the 1st.</summary>
    public string? RemindersSecret { get; set; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(PrivateKey);
}

/// <summary>The app's public key for subscribing; none when push isn't set up on this server.</summary>
public sealed record PushKey(string? PublicKey);

/// <summary>A device's push subscription, as the browser's <c>PushSubscription.toJSON()</c> gives it.</summary>
public sealed record SavePushSubscriptionRequest(string Endpoint, string P256dh, string Auth);

/// <summary>The device to stop reminding.</summary>
public sealed record RemovePushSubscriptionRequest(string Endpoint);

/// <summary>What one run of the reminder did: reminded, dropped (the device unsubscribed) and failed devices.</summary>
public sealed record ReminderReport(int Sent, int Removed, int Failed);

/// <summary>The notification a device shows; <paramref name="Url"/> opens when it is tapped.</summary>
public sealed record PushMessage(string Title, string Body, string Url);

/// <summary>The reminder's words (F-033's final prototype). English, as the rest of the server's texts.</summary>
public static class BudgetReminder
{
    public const string Url = "/budget";

    /// <summary>
    /// "Plan December's budget", "Start from November's and change what you need."; without an earlier plan, what
    /// planning gives.
    /// </summary>
    public static PushMessage MessageFor(DateOnly month, DateOnly? lastPlanned) =>
        new(
            $"Plan {NameOf(month)}'s budget",
            lastPlanned is { } last
                ? $"Start from {NameOf(last)}'s and change what you need."
                : "Set what you can spend this month and see what's left.",
            Url);

    private static string NameOf(DateOnly month) => month.ToString("MMMM", CultureInfo.InvariantCulture);
}

/// <summary>A device's push subscription kept or forgotten for the signed-in person (F-033).</summary>
public interface IPushSubscriptionService
{
    Task SaveAsync(Guid userId, SavePushSubscriptionRequest request, CancellationToken cancellationToken);

    Task RemoveAsync(Guid userId, string endpoint, CancellationToken cancellationToken);
}

/// <summary>
/// The reminder on the 1st (F-033): a push to every device of the people who haven't planned this month yet, once a
/// month; a second run the same month reminds nobody again.
/// </summary>
public interface IBudgetReminderService
{
    Task<ReminderReport> RunAsync(CancellationToken cancellationToken);
}
