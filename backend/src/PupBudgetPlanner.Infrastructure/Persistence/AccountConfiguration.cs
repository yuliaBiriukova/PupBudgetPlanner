using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    /// <summary>Longest <see cref="SourceKind"/> and <see cref="CardStyle"/> names, stored as text (ARCHITECTURE.md "Enums").</summary>
    private const int EnumMaxLength = 20;

    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.Property(account => account.Name).HasMaxLength(Account.NameMaxLength);
        builder.Property(account => account.Currency).HasMaxLength(Currencies.CodeLength).IsFixedLength();
        builder.Property(account => account.Source).HasConversion<string>().HasMaxLength(EnumMaxLength);
        builder.Property(account => account.CardStyle).HasConversion<string>().HasMaxLength(EnumMaxLength);
        builder.Property(account => account.OpeningBalance).HasPrecision(18, 2);
        builder.Ignore(account => account.IsArchived);

        // A person's accounts go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(account => account.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(account => account.UserId);

        // A source or bank stays while an account uses it (no action: deleting the person removes both at once)
        builder.HasOne<AccountSource>().WithMany().HasForeignKey(account => account.SourceId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<Bank>().WithMany().HasForeignKey(account => account.BankId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

internal sealed class AccountSourceConfiguration : IEntityTypeConfiguration<AccountSource>
{
    public void Configure(EntityTypeBuilder<AccountSource> builder)
    {
        builder.Property(source => source.Name).HasMaxLength(AccountSource.NameMaxLength);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(source => source.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(source => new { source.UserId, source.Name }).IsUnique();
    }
}

internal sealed class BankConfiguration : IEntityTypeConfiguration<Bank>
{
    public void Configure(EntityTypeBuilder<Bank> builder)
    {
        builder.Property(bank => bank.Name).HasMaxLength(Bank.NameMaxLength);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(bank => bank.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(bank => new { bank.UserId, bank.Name }).IsUnique();
    }
}
