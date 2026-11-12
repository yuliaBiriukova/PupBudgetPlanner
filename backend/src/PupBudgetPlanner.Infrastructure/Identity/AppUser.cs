using Microsoft.AspNetCore.Identity;
using PupBudgetPlanner.Domain.Families;

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

    /// <summary>
    /// Whether the account was created with an invite link ("Invited" on the People page). Kept on the account, not
    /// read from the link, so the link can be deleted (I-006).
    /// </summary>
    public bool Invited { get; set; }

    /// <summary>The note of the link the account was created with, as it was then (I-006).</summary>
    public string? InvitationNote { get; set; }

    /// <summary>The currency totals and reports are shown in, picked in Settings (F-016); the hryvnia at first.</summary>
    public string ReportCurrency { get; set; } = Application.ExchangeRates.ReportCurrency.Default;

    /// <summary>What the other members of the family see of the person's transactions (F-030); every one at first.</summary>
    public TransactionShare FamilySeesTransactions { get; set; }
}
