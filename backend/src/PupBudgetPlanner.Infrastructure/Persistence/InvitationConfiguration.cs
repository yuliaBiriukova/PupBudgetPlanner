using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    /// <summary>SHA-256.</summary>
    private const int TokenHashLength = 32;

    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.Property(invitation => invitation.TokenHash).HasMaxLength(TokenHashLength);
        builder.HasIndex(invitation => invitation.TokenHash).IsUnique();
        builder.Property(invitation => invitation.Note).HasMaxLength(Invitation.NoteMaxLength);

        // The invitation outlives both accounts: a used link stays "used" after its account is deleted
        builder.HasOne<AppUser>().WithMany().HasForeignKey(invitation => invitation.CreatedById)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(invitation => invitation.UsedById)
            .OnDelete(DeleteBehavior.SetNull);
        // One account is created with one link at most; a family's links can be used later by the same person (F-023)
        builder.HasIndex(invitation => invitation.UsedById).IsUnique().HasFilter("created_account");

        // A family is deleted only after its waiting links are cancelled (FamilyCleanup), so none of them turns into
        // an admin's link that works
        builder.HasOne<Family>().WithMany().HasForeignKey(invitation => invitation.FamilyId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
