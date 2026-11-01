using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.ExchangeRates;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

/// <summary>The app's database: Identity's tables (users, external logins, …) plus the app's own.</summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options), IDataProtectionKeyContext
{
    /// <summary>ASP.NET Core Data Protection keys (kept in the database because Render's disk is wiped on restart).</summary>
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    public DbSet<CategoryGroup> CategoryGroups => Set<CategoryGroup>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Invitation> Invitations => Set<Invitation>();

    public DbSet<Account> Accounts => Set<Account>();

    public DbSet<AccountSource> AccountSources => Set<AccountSource>();

    public DbSet<Bank> Banks => Set<Bank>();

    /// <summary>The NBU's official rates kept per day (F-017), shared by everyone.</summary>
    public DbSet<ExchangeRate> ExchangeRates => Set<ExchangeRate>();

    /// <summary>The provider settings shared by the app and the design-time factory.</summary>
    internal static void Configure(DbContextOptionsBuilder options, string connectionString) =>
        options
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Identity's own table and key setup first, so the app's configurations can refine it
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(InfrastructureAssembly.Instance);
    }
}
