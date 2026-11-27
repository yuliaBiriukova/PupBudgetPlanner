using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Jars;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class JarConfiguration : IEntityTypeConfiguration<Jar>
{
    /// <summary>Longest <see cref="JarIcon"/>, <see cref="JarColor"/> and <see cref="JarMoveKind"/> names, stored as text.</summary>
    internal const int EnumMaxLength = 20;

    public void Configure(EntityTypeBuilder<Jar> builder)
    {
        builder.Property(jar => jar.Name).HasMaxLength(Jar.NameMaxLength);
        builder.Property(jar => jar.Note).HasMaxLength(Jar.NoteMaxLength);
        builder.Property(jar => jar.Currency).HasMaxLength(Currencies.CodeLength).IsFixedLength();
        builder.Property(jar => jar.Icon).HasConversion<string>().HasMaxLength(EnumMaxLength);
        builder.Property(jar => jar.Color).HasConversion<string>().HasMaxLength(EnumMaxLength);
        builder.Property(jar => jar.Goal).HasPrecision(18, 2);
        builder.Ignore(jar => jar.IsClosed);

        // A person's jars go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(jar => jar.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(jar => jar.UserId);
    }
}

internal sealed class JarMoveConfiguration : IEntityTypeConfiguration<JarMove>
{
    public void Configure(EntityTypeBuilder<JarMove> builder)
    {
        builder.Property(move => move.Kind).HasConversion<string>().HasMaxLength(JarConfiguration.EnumMaxLength);
        builder.Property(move => move.Amount).HasPrecision(18, 2);
        builder.Property(move => move.AccountAmount).HasPrecision(18, 2);

        // A jar's history goes with the jar (only with the person: jars are closed, not deleted)
        builder.HasOne<Jar>().WithMany().HasForeignKey(move => move.JarId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(move => move.JarId);

        // An account with jar money can't be deleted (the service says so); deleting the person removes both at once
        builder.HasOne<Account>().WithMany().HasForeignKey(move => move.AccountId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(move => move.AccountId);

        // The other jar of a move between jars: only named, kept when it closes
        builder.HasOne<Jar>().WithMany().HasForeignKey(move => move.OtherJarId).OnDelete(DeleteBehavior.NoAction);
    }
}

internal sealed class JarBudgetConfiguration : IEntityTypeConfiguration<JarBudget>
{
    public void Configure(EntityTypeBuilder<JarBudget> builder)
    {
        builder.ToTable("jar_budgets");
        builder.HasKey(jar => new { jar.BudgetMonthId, jar.JarId });
        builder.Property(jar => jar.Amount).HasPrecision(18, 2);

        builder.HasOne<BudgetMonth>().WithMany(plan => plan.Jars).HasForeignKey(jar => jar.BudgetMonthId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Jar>().WithMany().HasForeignKey(jar => jar.JarId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(jar => jar.JarId);
    }
}
