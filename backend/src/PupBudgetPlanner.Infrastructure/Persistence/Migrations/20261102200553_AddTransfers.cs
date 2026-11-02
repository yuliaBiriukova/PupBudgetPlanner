using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTransfers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "category_id",
                table: "transactions",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "to_account_id",
                table: "transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "to_amount",
                table: "transactions",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_transactions_to_account_id",
                table: "transactions",
                column: "to_account_id");

            migrationBuilder.AddCheckConstraint(
                name: "ck_transactions_transfer_shape",
                table: "transactions",
                sql: "(type = 'Transfer' AND to_account_id IS NOT NULL AND to_amount IS NOT NULL\n    AND category_id IS NULL AND to_account_id <> account_id)\nOR (type <> 'Transfer' AND to_account_id IS NULL AND to_amount IS NULL\n    AND category_id IS NOT NULL)");

            migrationBuilder.AddForeignKey(
                name: "fk_transactions_accounts_to_account_id",
                table: "transactions",
                column: "to_account_id",
                principalTable: "accounts",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_transactions_accounts_to_account_id",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "ix_transactions_to_account_id",
                table: "transactions");

            migrationBuilder.DropCheckConstraint(
                name: "ck_transactions_transfer_shape",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "to_account_id",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "to_amount",
                table: "transactions");

            migrationBuilder.AlterColumn<Guid>(
                name: "category_id",
                table: "transactions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
