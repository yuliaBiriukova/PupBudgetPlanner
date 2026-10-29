using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "blocked_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            // Accounts made before F-028: their ids are UUIDv7, whose first 48 bits are the creation time in ms
            migrationBuilder.Sql(
                """
                UPDATE users
                SET created_at = to_timestamp(
                    ('x' || lpad(substr(replace(id::text, '-', ''), 1, 12), 16, '0'))::bit(64)::bigint / 1000.0)
                WHERE substr(id::text, 15, 1) = '7';
                """);

            migrationBuilder.CreateTable(
                name: "invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<byte[]>(type: "bytea", maxLength: 32, nullable: false),
                    note = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    created_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    used_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_invitations", x => x.id);
                    table.ForeignKey(
                        name: "fk_invitations_users_created_by_id",
                        column: x => x.created_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_invitations_users_used_by_id",
                        column: x => x.used_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_invitations_created_by_id",
                table: "invitations",
                column: "created_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_invitations_token_hash",
                table: "invitations",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_invitations_used_by_id",
                table: "invitations",
                column: "used_by_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "invitations");

            migrationBuilder.DropColumn(
                name: "blocked_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "users");
        }
    }
}
