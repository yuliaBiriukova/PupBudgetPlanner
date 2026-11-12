using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Infrastructure.Identity;

internal sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    /// <summary>Longest <see cref="Domain.Families.TransactionShare"/> name, stored as text (ARCHITECTURE.md "Enums").</summary>
    private const int ShareMaxLength = 20;

    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("users");
        builder.Property(user => user.DisplayName).HasMaxLength(AuthLimits.DisplayNameMaxLength);
        // Accounts made before F-028 get their date from the id (UUIDv7) in the migration
        builder.Property(user => user.CreatedAt).HasDefaultValueSql("now()");
        // Everyone who had an account before F-016 gets the hryvnia, as their totals were until then
        builder.Property(user => user.ReportCurrency)
            .HasMaxLength(Currencies.CodeLength)
            .HasDefaultValue(ReportCurrency.Default);
        // Everyone shares every transaction until they choose otherwise (F-030; the migration's default)
        builder.Property(user => user.FamilySeesTransactions).HasConversion<string>().HasMaxLength(ShareMaxLength);
        builder.HasIndex(user => user.NormalizedEmail).HasDatabaseName("ix_users_normalized_email");
        builder.HasIndex(user => user.NormalizedUserName).HasDatabaseName("ix_users_normalized_user_name");
    }
}

/// <summary>
/// Identity names its tables and indexes itself (<c>AspNetUsers</c>, <c>EmailIndex</c>); the naming convention
/// only renames defaults, so they are renamed here to the database's snake_case (ADR 0009).
/// </summary>
internal sealed class IdentityTableConfiguration :
    IEntityTypeConfiguration<IdentityRole<Guid>>,
    IEntityTypeConfiguration<IdentityRoleClaim<Guid>>,
    IEntityTypeConfiguration<IdentityUserClaim<Guid>>,
    IEntityTypeConfiguration<IdentityUserLogin<Guid>>,
    IEntityTypeConfiguration<IdentityUserRole<Guid>>,
    IEntityTypeConfiguration<IdentityUserToken<Guid>>
{
    public void Configure(EntityTypeBuilder<IdentityRole<Guid>> builder)
    {
        builder.ToTable("roles");
        builder.HasIndex(role => role.NormalizedName).HasDatabaseName("ix_roles_normalized_name");
    }

    public void Configure(EntityTypeBuilder<IdentityRoleClaim<Guid>> builder) => builder.ToTable("role_claims");

    public void Configure(EntityTypeBuilder<IdentityUserClaim<Guid>> builder) => builder.ToTable("user_claims");

    public void Configure(EntityTypeBuilder<IdentityUserLogin<Guid>> builder) => builder.ToTable("user_logins");

    public void Configure(EntityTypeBuilder<IdentityUserRole<Guid>> builder) => builder.ToTable("user_roles");

    public void Configure(EntityTypeBuilder<IdentityUserToken<Guid>> builder) => builder.ToTable("user_tokens");
}
