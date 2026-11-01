using Microsoft.AspNetCore.Identity;

namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>A person's account. Identity keeps the email (also the user name) and the password hash.</summary>
public sealed class AppUser : IdentityUser<Guid>
{
    /// <summary>The name the person and their family see.</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>When the account was created ("Joined" on the People page).</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>When the admin took the person's access away; empty while they can sign in (F-028).</summary>
    public DateTimeOffset? BlockedAt { get; set; }

    /// <summary>The currency totals and reports are shown in, picked in Settings (F-016); the hryvnia at first.</summary>
    public string ReportCurrency { get; set; } = Application.ExchangeRates.ReportCurrency.Default;
}
