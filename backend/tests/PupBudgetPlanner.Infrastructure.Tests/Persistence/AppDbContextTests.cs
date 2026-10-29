using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Categories;
using PupBudgetPlanner.Infrastructure.Identity;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Tests.Persistence;

public sealed class AppDbContextTests
{
    // Building the model and comparing it with the migrations never opens a connection.
    private static AppDbContext CreateContext() => new DesignTimeDbContextFactory().CreateDbContext([]);

    [Fact]
    public void Migrations_are_up_to_date_with_the_model()
    {
        using var context = CreateContext();

        context.Database.HasPendingModelChanges().Should().BeFalse(
            "every model change needs a migration: run 'dotnet ef migrations add <Name>'");
    }

    [Fact]
    public void Tables_and_columns_use_snake_case()
    {
        using var context = CreateContext();

        var keys = context.Model.FindEntityType(typeof(DataProtectionKey))!;

        keys.GetTableName().Should().Be("data_protection_keys");
        keys.GetProperties().Select(property => property.GetColumnName())
            .Should().BeEquivalentTo("id", "friendly_name", "xml");
    }

    [Fact]
    public void Category_groups_store_the_kind_as_text_and_go_with_the_account()
    {
        using var context = CreateContext();

        var groups = context.Model.FindEntityType(typeof(CategoryGroup))!;

        groups.GetTableName().Should().Be("category_groups");
        groups.FindProperty(nameof(CategoryGroup.Kind))!.GetProviderClrType().Should().Be<string>();
        groups.GetForeignKeys().Should().ContainSingle(key => key.PrincipalEntityType.ClrType == typeof(AppUser))
            .Which.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);
    }

    [Fact]
    public void Names_are_unique_per_person_for_groups_and_per_group_for_categories()
    {
        using var context = CreateContext();

        UniqueIndexColumns(context, typeof(CategoryGroup)).Should().ContainSingle()
            .Which.Should().Equal("user_id", "name");
        UniqueIndexColumns(context, typeof(Category)).Should().ContainSingle()
            .Which.Should().Equal("group_id", "name");
        context.Model.FindEntityType(typeof(Category))!.GetTableName().Should().Be("categories");
    }

    private static IEnumerable<IEnumerable<string>> UniqueIndexColumns(AppDbContext context, Type entity) =>
        context.Model.FindEntityType(entity)!.GetIndexes()
            .Where(index => index.IsUnique)
            .Select(index => index.Properties.Select(property => property.GetColumnName()));
}
