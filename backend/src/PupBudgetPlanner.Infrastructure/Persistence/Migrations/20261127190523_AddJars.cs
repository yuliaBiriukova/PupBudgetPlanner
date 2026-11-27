using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "jars",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    icon = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false),
                    goal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    target_month = table.Column<DateOnly>(type: "date", nullable: true),
                    note = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    closed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jars", x => x.id);
                    table.ForeignKey(
                        name: "fk_jars_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jar_budgets",
                columns: table => new
                {
                    budget_month_id = table.Column<Guid>(type: "uuid", nullable: false),
                    jar_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jar_budgets", x => new { x.budget_month_id, x.jar_id });
                    table.ForeignKey(
                        name: "fk_jar_budgets_budget_months_budget_month_id",
                        column: x => x.budget_month_id,
                        principalTable: "budget_months",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_jar_budgets_jars_jar_id",
                        column: x => x.jar_id,
                        principalTable: "jars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jar_moves",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jar_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    account_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    other_jar_id = table.Column<Guid>(type: "uuid", nullable: true),
                    month = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jar_moves", x => x.id);
                    table.ForeignKey(
                        name: "fk_jar_moves_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_jar_moves_jars_jar_id",
                        column: x => x.jar_id,
                        principalTable: "jars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_jar_moves_jars_other_jar_id",
                        column: x => x.other_jar_id,
                        principalTable: "jars",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_jar_budgets_jar_id",
                table: "jar_budgets",
                column: "jar_id");

            migrationBuilder.CreateIndex(
                name: "ix_jar_moves_account_id",
                table: "jar_moves",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_jar_moves_jar_id",
                table: "jar_moves",
                column: "jar_id");

            migrationBuilder.CreateIndex(
                name: "ix_jar_moves_other_jar_id",
                table: "jar_moves",
                column: "other_jar_id");

            migrationBuilder.CreateIndex(
                name: "ix_jars_user_id",
                table: "jars",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "jar_budgets");

            migrationBuilder.DropTable(
                name: "jar_moves");

            migrationBuilder.DropTable(
                name: "jars");
        }
    }
}
