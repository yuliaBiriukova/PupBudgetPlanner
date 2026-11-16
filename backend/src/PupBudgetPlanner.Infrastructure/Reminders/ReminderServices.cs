using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Application.Reminders;
using PupBudgetPlanner.Domain.Reminders;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Reminders;

internal sealed class PushSubscriptionService(AppDbContext dbContext, TimeProvider clock) : IPushSubscriptionService
{
    public async Task SaveAsync(Guid userId, SavePushSubscriptionRequest request, CancellationToken cancellationToken)
    {
        var device = await dbContext.PushSubscriptions
            .SingleOrDefaultAsync(subscription => subscription.Endpoint == request.Endpoint, cancellationToken);
        if (device is null)
        {
            dbContext.PushSubscriptions.Add(new PushSubscription
            {
                UserId = userId,
                Endpoint = request.Endpoint,
                P256dh = request.P256dh,
                Auth = request.Auth,
                CreatedAt = clock.GetUtcNow(),
            });
        }
        else
        {
            // The same device signed in as someone else is theirs now
            device.UserId = userId;
            device.P256dh = request.P256dh;
            device.Auth = request.Auth;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task RemoveAsync(Guid userId, string endpoint, CancellationToken cancellationToken) =>
        dbContext.PushSubscriptions
            .Where(subscription => subscription.UserId == userId && subscription.Endpoint == endpoint)
            .ExecuteDeleteAsync(cancellationToken);
}

internal sealed class BudgetReminderService(
    AppDbContext dbContext, IWebPushSender sender, IOptionsMonitor<PushOptions> options, TimeProvider clock)
    : IBudgetReminderService
{
    public async Task<ReminderReport> RunAsync(CancellationToken cancellationToken)
    {
        if (!options.CurrentValue.IsConfigured)
        {
            return new ReminderReport(0, 0, 0);
        }

        var today = Kyiv.Today(clock);
        var month = new DateOnly(today.Year, today.Month, 1);
        // Devices not reminded this month whose people haven't planned it yet
        var devices = await dbContext.PushSubscriptions
            .Where(device => device.RemindedFor != month)
            .Where(device => !dbContext.BudgetMonths.Any(plan => plan.UserId == device.UserId && plan.Month == month))
            .ToListAsync(cancellationToken);
        var userIds = devices.Select(device => device.UserId).Distinct().ToList();
        var lastPlanned = await dbContext.BudgetMonths.AsNoTracking()
            .Where(plan => userIds.Contains(plan.UserId) && plan.Month < month)
            .GroupBy(plan => plan.UserId)
            .Select(plans => new { UserId = plans.Key, Month = plans.Max(plan => plan.Month) })
            .ToDictionaryAsync(last => last.UserId, last => last.Month, cancellationToken);

        int sent = 0, removed = 0, failed = 0;
        foreach (var device in devices)
        {
            var message = BudgetReminder.MessageFor(
                month, lastPlanned.TryGetValue(device.UserId, out var last) ? last : null);
            switch (await sender.SendAsync(device, message, cancellationToken))
            {
                case PushDelivery.Sent:
                    device.RemindedFor = month;
                    sent++;
                    break;
                case PushDelivery.Gone:
                    dbContext.PushSubscriptions.Remove(device);
                    removed++;
                    break;
                default:
                    failed++;
                    break;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new ReminderReport(sent, removed, failed);
    }
}
