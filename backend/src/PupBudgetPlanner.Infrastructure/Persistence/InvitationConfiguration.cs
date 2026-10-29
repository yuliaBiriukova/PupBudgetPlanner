using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
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
        builder.HasIndex(invitation => invitation.UsedById).IsUnique();
    }
}
