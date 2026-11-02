using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Domain.Transactions;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    /// <summary>Longest <see cref="TransactionType"/> name, stored as text (ARCHITECTURE.md "Enums").</summary>
    private const int TypeMaxLength = 20;

    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.Property(transaction => transaction.Type).HasConversion<string>().HasMaxLength(TypeMaxLength);
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2);
        builder.Property(transaction => transaction.Note).HasMaxLength(Transaction.NoteMaxLength);
        builder.Ignore(transaction => transaction.Movement);

        // A person's transactions go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(transaction => transaction.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // An account or a category stays while a transaction uses it: only an account without transactions can be
        // deleted (I-011). No action: deleting the person removes them all at once
        builder.HasOne<Account>().WithMany().HasForeignKey(transaction => transaction.AccountId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<Category>().WithMany().HasForeignKey(transaction => transaction.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        // The latest first (the Transactions page), and each account's or category's own
        builder.HasIndex(transaction => new { transaction.UserId, transaction.Date });
        builder.HasIndex(transaction => transaction.AccountId);
        builder.HasIndex(transaction => transaction.CategoryId);
    }
}
