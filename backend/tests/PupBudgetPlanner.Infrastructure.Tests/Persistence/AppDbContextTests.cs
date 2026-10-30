using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.Accounts;
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

    [Fact]
    public void Accounts_sources_and_banks_go_with_the_person_and_stay_while_an_account_uses_them()
    {
        using var context = CreateContext();

        var accounts = context.Model.FindEntityType(typeof(Account))!;

        accounts.GetTableName().Should().Be("accounts");
        accounts.FindProperty(nameof(Account.Source))!.GetProviderClrType().Should().Be<string>();
        accounts.FindProperty(nameof(Account.CardStyle))!.GetProviderClrType().Should().Be<string>();
        accounts.FindProperty(nameof(Account.OpeningBalance))!.GetColumnType().Should().Be("numeric(18,2)");
        accounts.GetForeignKeys().Should().HaveCount(3).And.Satisfy(
            key => key.PrincipalEntityType.ClrType == typeof(AppUser) && key.DeleteBehavior == DeleteBehavior.Cascade,
            key => key.PrincipalEntityType.ClrType == typeof(AccountSource) && key.DeleteBehavior == DeleteBehavior.NoAction,
            key => key.PrincipalEntityType.ClrType == typeof(Bank) && key.DeleteBehavior == DeleteBehavior.NoAction);

        foreach (var personal in new[] { typeof(AccountSource), typeof(Bank) })
        {
            context.Model.FindEntityType(personal)!.GetForeignKeys().Should().ContainSingle()
                .Which.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);
            UniqueIndexColumns(context, personal).Should().ContainSingle().Which.Should().Equal("user_id", "name");
        }
    }

    private static IEnumerable<IEnumerable<string>> UniqueIndexColumns(AppDbContext context, Type entity) =>
        context.Model.FindEntityType(entity)!.GetIndexes()
            .Where(index => index.IsUnique)
            .Select(index => index.Properties.Select(property => property.GetColumnName()));
}
