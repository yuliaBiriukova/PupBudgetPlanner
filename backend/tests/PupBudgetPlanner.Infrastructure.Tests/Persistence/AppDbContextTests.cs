using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
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
}
