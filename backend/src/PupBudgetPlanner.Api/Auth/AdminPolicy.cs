using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.Access;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>
/// Only the admin: a signed-in person whose email is in <c>Access:AdminEmails</c> (F-028, ADR 0016). The email comes
/// from the sign-in cookie, which Identity fills from the account.
/// </summary>
public static class AdminPolicy
{
    public const string Name = "Admin";

    public static AuthorizationBuilder AddAdminPolicy(this AuthorizationBuilder authorization) =>
        authorization.AddPolicy(Name, policy => policy
            .RequireAuthenticatedUser()
            .AddRequirements(new AdminRequirement()));
}

public sealed class AdminRequirement : IAuthorizationRequirement;

public sealed class AdminRequirementHandler(IOptionsMonitor<AccessOptions> access) : AuthorizationHandler<AdminRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AdminRequirement requirement)
    {
        if (access.CurrentValue.IsAdmin(context.User.FindFirstValue(ClaimTypes.Email)))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
