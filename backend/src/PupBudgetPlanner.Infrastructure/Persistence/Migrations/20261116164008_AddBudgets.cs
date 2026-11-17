using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBudgets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "budget_months",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    month = table.Column<DateOnly>(type: "date", nullable: false),
                    total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_budget_months", x => x.id);
                    table.ForeignKey(
                        name: "fk_budget_months_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "push_subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    endpoint = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    p256dh = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    auth = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    reminded_for = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_push_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_push_subscriptions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "category_budgets",
                columns: table => new
                {
                    budget_month_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_budgets", x => new { x.budget_month_id, x.category_id });
                    table.ForeignKey(
                        name: "fk_category_budgets_budget_months_budget_month_id",
                        column: x => x.budget_month_id,
                        principalTable: "budget_months",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_category_budgets_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_budgets",
                columns: table => new
                {
                    budget_month_id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group_budgets", x => new { x.budget_month_id, x.group_id });
                    table.ForeignKey(
                        name: "fk_group_budgets_budget_months_budget_month_id",
                        column: x => x.budget_month_id,
                        principalTable: "budget_months",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_group_budgets_category_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "category_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_budget_months_user_id_month",
                table: "budget_months",
                columns: new[] { "user_id", "month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_category_budgets_category_id",
                table: "category_budgets",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_group_budgets_group_id",
                table: "group_budgets",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "ix_push_subscriptions_endpoint",
                table: "push_subscriptions",
                column: "endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_push_subscriptions_user_id",
                table: "push_subscriptions",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "category_budgets");

            migrationBuilder.DropTable(
                name: "group_budgets");

            migrationBuilder.DropTable(
                name: "push_subscriptions");

            migrationBuilder.DropTable(
                name: "budget_months");
        }
    }
}
