using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class FamilyConfiguration : IEntityTypeConfiguration<Family>
{
    public void Configure(EntityTypeBuilder<Family> builder)
    {
        builder.Property(family => family.Name).HasMaxLength(Family.NameMaxLength);

        // Deleting the owner's account hands the family over first (PeopleService); the database refuses it otherwise
        builder.HasOne<AppUser>().WithMany().HasForeignKey(family => family.OwnerId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(family => family.Members)
            .WithOne()
            .HasForeignKey(member => member.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class FamilyMemberConfiguration : IEntityTypeConfiguration<FamilyMember>
{
    /// <summary>One family per person (F-023): a second one for the same person fails on it.</summary>
    public const string OneFamilyIndex = "ix_family_members_user_id";

    public void Configure(EntityTypeBuilder<FamilyMember> builder)
    {
        builder.HasKey(member => new { member.FamilyId, member.UserId });

        builder.HasIndex(member => member.UserId).IsUnique().HasDatabaseName(OneFamilyIndex);

        // Someone whose account is deleted leaves with it
        builder.HasOne<AppUser>().WithMany().HasForeignKey(member => member.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
