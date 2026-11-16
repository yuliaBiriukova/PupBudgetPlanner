using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Budgets;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class BudgetMonthConfiguration : IEntityTypeConfiguration<BudgetMonth>
{
    public void Configure(EntityTypeBuilder<BudgetMonth> builder)
    {
        builder.Property(plan => plan.Total).HasPrecision(18, 2);
        builder.Ignore(plan => plan.Plan);

        // One plan a person a month (F-033)
        builder.HasIndex(plan => new { plan.UserId, plan.Month }).IsUnique();

        // A person's plans go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(plan => plan.UserId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(plan => plan.Groups).WithOne().HasForeignKey(group => group.BudgetMonthId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(plan => plan.Categories).WithOne().HasForeignKey(category => category.BudgetMonthId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class GroupBudgetConfiguration : IEntityTypeConfiguration<GroupBudget>
{
    public void Configure(EntityTypeBuilder<GroupBudget> builder)
    {
        builder.ToTable("group_budgets");
        builder.HasKey(group => new { group.BudgetMonthId, group.GroupId });
        builder.Property(group => group.Amount).HasPrecision(18, 2);

        // A deleted group (only an empty one can be, F-029) takes its budgets with it
        builder.HasOne<CategoryGroup>().WithMany().HasForeignKey(group => group.GroupId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(group => group.GroupId);
    }
}

internal sealed class CategoryBudgetConfiguration : IEntityTypeConfiguration<CategoryBudget>
{
    public void Configure(EntityTypeBuilder<CategoryBudget> builder)
    {
        builder.ToTable("category_budgets");
        builder.HasKey(category => new { category.BudgetMonthId, category.CategoryId });
        builder.Property(category => category.Amount).HasPrecision(18, 2);

        // A deleted category (only one without transactions can be, F-029) takes its budgets with it
        builder.HasOne<Category>().WithMany().HasForeignKey(category => category.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(category => category.CategoryId);
    }
}
