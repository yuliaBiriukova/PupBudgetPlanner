using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PupBudgetPlanner.Application.Access;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Infrastructure.Access;
using PupBudgetPlanner.Infrastructure.Accounts;
using PupBudgetPlanner.Infrastructure.Identity;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure;

public static class DependencyInjection
{
    public const string ConnectionStringName = "Database";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(ConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{ConnectionStringName}' is not configured. Locally set it with " +
                $"'dotnet user-secrets set \"ConnectionStrings:{ConnectionStringName}\" \"<connection string>\"'; " +
                $"in production set the 'ConnectionStrings__{ConnectionStringName}' environment variable.");
        }

        services.AddDbContext<AppDbContext>(options => AppDbContext.Configure(options, connectionString));

        services
            .AddDataProtection()
            .SetApplicationName("PupBudgetPlanner")
            .PersistKeysToDbContext<AppDbContext>();

        services.AddIdentityStores();
        services.AddAccess(configuration);
        services.AddScoped<IAccountService, AccountService>();

        return services;
    }

    /// <summary>
    /// Identity's users, password rules and lockout, stored with EF Core. The cookie and the authentication
    /// schemes are HTTP settings and live in the API.
    /// </summary>
    private static void AddIdentityStores(this IServiceCollection services)
    {
        services
            .AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;

                // Length is the rule (NIST SP 800-63B); the validators give the friendly messages
                options.Password.RequiredLength = AuthLimits.PasswordMinLength;
                options.Password.RequiredUniqueChars = 1;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;

                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddSignInManager()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddScoped<IAccountCreator, AccountCreator>();
        services.AddScoped<IAuthService, AuthService>();
    }

    /// <summary>Invite-only sign-up, invite links and the admin's People page (F-028).</summary>
    private static void AddAccess(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AccessOptions>(configuration.GetSection(AccessOptions.SectionName));
        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<IInvitationService, InvitationService>();
        services.AddScoped<IPeopleService, PeopleService>();
    }

    /// <summary>Applies pending EF Core migrations (one API instance, so start-up is a safe place).</summary>
    public static async Task MigrateDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await dbContext.Database.MigrateAsync(cancellationToken);
    }
}
