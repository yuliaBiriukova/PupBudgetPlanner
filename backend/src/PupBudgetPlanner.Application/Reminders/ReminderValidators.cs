using FluentValidation;
using PupBudgetPlanner.Domain.Reminders;

namespace PupBudgetPlanner.Application.Reminders;

/// <summary>
/// A subscription the server will post to: only the browsers' own push services over https, so the address can't point
/// the server anywhere else.
/// </summary>
public sealed class SavePushSubscriptionRequestValidator : AbstractValidator<SavePushSubscriptionRequest>
{
    /// <summary>Chrome and Edge (FCM), Firefox (Mozilla), Edge on Windows (WNS), Safari (Apple).</summary>
    private static readonly string[] PushHosts =
        ["fcm.googleapis.com", ".push.services.mozilla.com", ".notify.windows.com", ".push.apple.com"];

    public SavePushSubscriptionRequestValidator()
    {
        RuleFor(r => r.Endpoint).Cascade(CascadeMode.Stop)
            .NotEmpty().MaximumLength(PushSubscription.EndpointMaxLength)
            .Must(IsPushService).WithMessage("This isn't a browser's push address.");
        RuleFor(r => r.P256dh).Cascade(CascadeMode.Stop)
            .NotEmpty().MaximumLength(PushSubscription.KeyMaxLength).Must(IsBase64Url);
        RuleFor(r => r.Auth).Cascade(CascadeMode.Stop)
            .NotEmpty().MaximumLength(PushSubscription.KeyMaxLength).Must(IsBase64Url);
    }

    public static bool IsPushService(string endpoint) =>
        Uri.TryCreate(endpoint, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps
        && uri.IsDefaultPort
        && PushHosts.Any(host => host.StartsWith('.')
            ? uri.Host.EndsWith(host, StringComparison.OrdinalIgnoreCase)
            : uri.Host.Equals(host, StringComparison.OrdinalIgnoreCase));

    private static bool IsBase64Url(string value) =>
        value.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '=');
}

public sealed class RemovePushSubscriptionRequestValidator : AbstractValidator<RemovePushSubscriptionRequest>
{
    public RemovePushSubscriptionRequestValidator() =>
        RuleFor(r => r.Endpoint).NotEmpty().MaximumLength(PushSubscription.EndpointMaxLength);
}
