using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_invitations_used_by_id",
                table: "invitations");

            migrationBuilder.AddColumn<bool>(
                name: "created_account",
                table: "invitations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Every link used until now created its account (F-028); only a family's link can be used without one
            migrationBuilder.Sql("UPDATE invitations SET created_account = true WHERE used_at IS NOT NULL;");

            migrationBuilder.AddColumn<Guid>(
                name: "family_id",
                table: "invitations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "families",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_families", x => x.id);
                    table.ForeignKey(
                        name: "fk_families_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "family_members",
                columns: table => new
                {
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_family_members", x => new { x.family_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_family_members_families_family_id",
                        column: x => x.family_id,
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_family_members_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_invitations_family_id",
                table: "invitations",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "ix_invitations_used_by_id",
                table: "invitations",
                column: "used_by_id",
                unique: true,
                filter: "created_account");

            migrationBuilder.CreateIndex(
                name: "ix_families_owner_id",
                table: "families",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_family_members_user_id",
                table: "family_members",
                column: "user_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_invitations_families_family_id",
                table: "invitations",
                column: "family_id",
                principalTable: "families",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_invitations_families_family_id",
                table: "invitations");

            migrationBuilder.DropTable(
                name: "family_members");

            migrationBuilder.DropTable(
                name: "families");

            migrationBuilder.DropIndex(
                name: "ix_invitations_family_id",
                table: "invitations");

            migrationBuilder.DropIndex(
                name: "ix_invitations_used_by_id",
                table: "invitations");

            migrationBuilder.DropColumn(
                name: "created_account",
                table: "invitations");

            migrationBuilder.DropColumn(
                name: "family_id",
                table: "invitations");

            migrationBuilder.CreateIndex(
                name: "ix_invitations_used_by_id",
                table: "invitations",
                column: "used_by_id",
                unique: true);
        }
    }
}
