using Microsoft.AspNetCore.Identity;

namespace PupBudgetPlanner.Infrastructure.Identity;

/// <summary>A person's account. Identity keeps the email (also the user name) and the password hash.</summary>
public sealed class AppUser : IdentityUser<Guid>
{
    /// <summary>The name the person and their family see.</summary>
    public string DisplayName { get; set; } = string.Empty;
}
