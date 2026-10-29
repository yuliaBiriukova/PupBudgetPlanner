using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class CategoryGroupConfiguration : IEntityTypeConfiguration<CategoryGroup>
{
    /// <summary>Longest <see cref="CategoryKind"/> name, stored as text (ARCHITECTURE.md "Enums").</summary>
    private const int KindMaxLength = 20;

    public void Configure(EntityTypeBuilder<CategoryGroup> builder)
    {
        builder.Property(group => group.Name).HasMaxLength(CategoryGroup.NameMaxLength);
        builder.Property(group => group.Kind).HasConversion<string>().HasMaxLength(KindMaxLength);

        // A person's categories go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(group => group.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(group => new { group.UserId, group.Name }).IsUnique();

        builder.HasMany(group => group.Categories)
            .WithOne()
            .HasForeignKey(category => category.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.Property(category => category.Name).HasMaxLength(Category.NameMaxLength);

        // "Gifts" and "Other" are in two groups: names are unique inside a group only
        builder.HasIndex(category => new { category.GroupId, category.Name }).IsUnique();
    }
}
