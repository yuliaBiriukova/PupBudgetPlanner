using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.Reminders;
using PupBudgetPlanner.Domain.Reminders;

namespace PupBudgetPlanner.Infrastructure.Reminders;

/// <summary>What a push service said: delivered, the device is gone (unsubscribed), or something else went wrong.</summary>
public enum PushDelivery
{
    Sent,
    Gone,
    Failed,
}

/// <summary>Posts one message to one device's push service.</summary>
public interface IWebPushSender
{
    Task<PushDelivery> SendAsync(PushSubscription device, PushMessage message, CancellationToken cancellationToken);
}

internal sealed partial class WebPushSender(
    HttpClient http, IOptionsMonitor<PushOptions> options, TimeProvider clock, ILogger<WebPushSender> logger)
    : IWebPushSender
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<PushDelivery> SendAsync(
        PushSubscription device, PushMessage message, CancellationToken cancellationToken)
    {
        var push = options.CurrentValue;
        var endpoint = new Uri(device.Endpoint);
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        try
        {
            request.Content = new ByteArrayContent(
                WebPush.Encrypt(JsonSerializer.SerializeToUtf8Bytes(message, Json), device.P256dh, device.Auth));
        }
        catch (Exception exception) when (exception is FormatException or System.Security.Cryptography.CryptographicException)
        {
            // A subscription with broken keys can never get a message
            LogBrokenKeys(exception);
            return PushDelivery.Gone;
        }

        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        request.Content.Headers.ContentEncoding.Add("aes128gcm");
        request.Headers.TryAddWithoutValidation(
            "Authorization",
            WebPush.Vapid(endpoint, push.Subject, push.PublicKey!, push.PrivateKey!, clock.GetUtcNow()));
        // Kept a day by the push service while the phone is off; the reminder is old news after that
        request.Headers.Add("TTL", "86400");
        request.Headers.Add("Urgency", "normal");

        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return PushDelivery.Sent;
            }

            if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                return PushDelivery.Gone;
            }

            LogRefused((int)response.StatusCode, endpoint.Host);
            return PushDelivery.Failed;
        }
        catch (HttpRequestException exception)
        {
            LogUnreachable(exception, endpoint.Host);
            return PushDelivery.Failed;
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            LogUnreachable(exception, endpoint.Host);
            return PushDelivery.Failed;
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "A push subscription has broken keys")]
    private partial void LogBrokenKeys(Exception exception);

    [LoggerMessage(Level = LogLevel.Warning, Message = "The push service {Host} answered {Status}")]
    private partial void LogRefused(int status, string host);

    [LoggerMessage(Level = LogLevel.Warning, Message = "The push service {Host} couldn't be reached")]
    private partial void LogUnreachable(Exception exception, string host);
}
