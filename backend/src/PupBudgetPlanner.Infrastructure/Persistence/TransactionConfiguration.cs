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

    /// <summary>
    /// A transfer has its To account and amount and no category; an expense or an income a category and no To (F-019).
    /// The domain keeps to it; the database makes sure.
    /// </summary>
    internal const string TransferShape = "ck_transactions_transfer_shape";

    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable(table => table.HasCheckConstraint(
            TransferShape,
            $"""
            (type = '{nameof(TransactionType.Transfer)}' AND to_account_id IS NOT NULL AND to_amount IS NOT NULL
                AND category_id IS NULL AND to_account_id <> account_id)
            OR (type <> '{nameof(TransactionType.Transfer)}' AND to_account_id IS NULL AND to_amount IS NULL
                AND category_id IS NOT NULL)
            """));

        builder.Property(transaction => transaction.Type).HasConversion<string>().HasMaxLength(TypeMaxLength);
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2);
        builder.Property(transaction => transaction.ToAmount).HasPrecision(18, 2);
        builder.Property(transaction => transaction.Note).HasMaxLength(Transaction.NoteMaxLength);
        builder.Ignore(transaction => transaction.Movement);

        // A person's transactions go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(transaction => transaction.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // An account or a category stays while a transaction uses it: only an account without transactions (a
        // transfer's To counts too) can be deleted (I-011). No action: deleting the person removes them all at once
        builder.HasOne<Account>().WithMany().HasForeignKey(transaction => transaction.AccountId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<Account>().WithMany().HasForeignKey(transaction => transaction.ToAccountId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<Category>().WithMany().HasForeignKey(transaction => transaction.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        // The latest first (the Transactions page), and each account's or category's own
        builder.HasIndex(transaction => new { transaction.UserId, transaction.Date });
        builder.HasIndex(transaction => transaction.AccountId);
        builder.HasIndex(transaction => transaction.ToAccountId);
        builder.HasIndex(transaction => transaction.CategoryId);
    }
}
