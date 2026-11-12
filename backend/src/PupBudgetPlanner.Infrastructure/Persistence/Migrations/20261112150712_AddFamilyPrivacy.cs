using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyPrivacy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // F-030: everyone shares as before (every transaction, every account in full) until they choose otherwise
            migrationBuilder.AddColumn<string>(
                name: "family_sees_transactions",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Every");

            migrationBuilder.AddColumn<bool>(
                name: "is_private",
                table: "categories",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "family_sees",
                table: "accounts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Everything");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "family_sees_transactions",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_private",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "family_sees",
                table: "accounts");
        }
    }
}
