using Microsoft.AspNetCore.Identity;
using PupBudgetPlanner.Application.Settings;

namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>The settings live on the person's account (<see cref="AppUser"/>), saved through Identity.</summary>
internal sealed class SettingsService(UserManager<AppUser> userManager) : ISettingsService
{
    public async Task<UserSettings?> GetAsync(Guid userId, CancellationToken cancellationToken) =>
        await FindAsync(userId, cancellationToken) is { } user ? ToSettings(user) : null;

    public Task<UserSettings?> ChangeNameAsync(
        Guid userId, ChangeNameRequest request, CancellationToken cancellationToken) =>
        ChangeAsync(userId, user => user.DisplayName = request.DisplayName.Trim(), cancellationToken);

    public Task<UserSettings?> ChangeReportCurrencyAsync(
        Guid userId, ChangeReportCurrencyRequest request, CancellationToken cancellationToken) =>
        ChangeAsync(userId, user => user.ReportCurrency = request.Currency, cancellationToken);

    private async Task<UserSettings?> ChangeAsync(
        Guid userId, Action<AppUser> change, CancellationToken cancellationToken)
    {
        var user = await FindAsync(userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        change(user);
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Couldn't save the settings: {string.Join(", ", result.Errors.Select(error => error.Code))}.");
        }

        return ToSettings(user);
    }

    private Task<AppUser?> FindAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return userManager.FindByIdAsync(userId.ToString());
    }

    private static UserSettings ToSettings(AppUser user) =>
        new(user.DisplayName, user.Email ?? string.Empty, user.ReportCurrency);
}
