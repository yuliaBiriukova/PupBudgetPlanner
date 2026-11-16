using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Reminders;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.ExchangeRates;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Domain.Transactions;
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

    /// <summary>Families (F-023) and who is in them.</summary>
    public DbSet<Family> Families => Set<Family>();

    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();

    public DbSet<Account> Accounts => Set<Account>();

    public DbSet<AccountSource> AccountSources => Set<AccountSource>();

    public DbSet<Bank> Banks => Set<Bank>();

    /// <summary>Expenses and incomes (F-018), transfers (F-019).</summary>
    public DbSet<Transaction> Transactions => Set<Transaction>();

    /// <summary>The NBU's official rates kept per day (F-017), shared by everyone.</summary>
    public DbSet<ExchangeRate> ExchangeRates => Set<ExchangeRate>();

    /// <summary>Each person's plan for a month (F-033), with its group and category budgets.</summary>
    public DbSet<BudgetMonth> BudgetMonths => Set<BudgetMonth>();

    /// <summary>The devices that get the budget reminder on the 1st (F-033).</summary>
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

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
