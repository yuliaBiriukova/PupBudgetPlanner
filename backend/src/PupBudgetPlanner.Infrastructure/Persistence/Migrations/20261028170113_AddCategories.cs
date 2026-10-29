using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "category_groups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_groups", x => x.id);
                    table.ForeignKey(
                        name: "fk_category_groups_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_categories", x => x.id);
                    table.ForeignKey(
                        name: "fk_categories_category_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "category_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_categories_group_id_name",
                table: "categories",
                columns: new[] { "group_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_category_groups_user_id_name",
                table: "category_groups",
                columns: new[] { "user_id", "name" },
                unique: true);

            // Accounts created before F-013 get the default set too. A frozen copy of DefaultCategories as it was
            // then: new accounts get theirs from the code, so later changes to the defaults don't belong here.
            migrationBuilder.Sql(
                """
                INSERT INTO category_groups (id, user_id, name, kind, sort_order)
                SELECT gen_random_uuid(), u.id, g.name, g.kind, g.sort_order
                FROM users u
                CROSS JOIN (VALUES
                    ('Income', 'Income', 1),
                    ('Home expenses', 'Expense', 2),
                    ('Daily living', 'Expense', 3),
                    ('Health', 'Expense', 4),
                    ('Education', 'Expense', 5),
                    ('Entertainment', 'Expense', 6),
                    ('Subscriptions', 'Expense', 7)
                ) AS g (name, kind, sort_order);

                INSERT INTO categories (id, group_id, name, sort_order, is_archived)
                SELECT gen_random_uuid(), cg.id, c.name, c.sort_order, FALSE
                FROM category_groups cg
                JOIN (VALUES
                    ('Income', 'Salary', 1), ('Income', 'Gifts', 2), ('Income', 'Other', 3),
                    ('Home expenses', 'Rent', 1), ('Home expenses', 'Bills', 2), ('Home expenses', 'Home supplies', 3),
                    ('Home expenses', 'Electronics', 4), ('Home expenses', 'Bank commission', 5),
                    ('Home expenses', 'Gifts', 6), ('Home expenses', 'Tax', 7), ('Home expenses', 'Delivery', 8),
                    ('Home expenses', 'Other', 9),
                    ('Daily living', 'Groceries', 1), ('Daily living', 'Clothing', 2), ('Daily living', 'Eating out', 3),
                    ('Daily living', 'Transportation', 4), ('Daily living', 'Salon/Barber', 5), ('Daily living', 'Sport', 6),
                    ('Health', 'Doctor/Dentist', 1), ('Health', 'Medicine/Drugs/Skincare', 2), ('Health', 'Emergency', 3),
                    ('Health', 'Therapy', 4),
                    ('Education', 'English lessons', 1), ('Education', 'Piano lessons', 2), ('Education', 'Driving', 3),
                    ('Entertainment', 'Activities', 1), ('Entertainment', 'Books', 2), ('Entertainment', 'Games', 3),
                    ('Entertainment', 'Hobbies', 4), ('Entertainment', 'Vacation', 5),
                    ('Subscriptions', 'Spotify', 1), ('Subscriptions', 'Phone', 2), ('Subscriptions', 'Subscriptions', 3)
                ) AS c (group_name, name, sort_order) ON c.group_name = cg.name;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "category_groups");
        }
    }
}
