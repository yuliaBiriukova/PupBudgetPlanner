namespace PupBudgetPlanner.Domain.Reminders;

/// <summary>
/// One device that gets the budget reminder on the 1st (F-033): the browser's push subscription, as the Push API gives
/// it. A device is one subscription; the same endpoint signed in as someone else moves to them.
/// </summary>
public sealed class PushSubscription
{
    public const int EndpointMaxLength = 1000;

    public const int KeyMaxLength = 200;

    public Guid Id { get; init; }

    public Guid UserId { get; set; }

    /// <summary>The push service's address for this device.</summary>
    public required string Endpoint { get; init; }

    /// <summary>The device's public key (P-256, base64url), what the message is encrypted to.</summary>
    public required string P256dh { get; set; }

    /// <summary>The device's authentication secret (base64url).</summary>
    public required string Auth { get; set; }

    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>The month (its first day) this device was last reminded to plan: a second run the same month skips it.</summary>
    public DateOnly? RemindedFor { get; set; }
}
