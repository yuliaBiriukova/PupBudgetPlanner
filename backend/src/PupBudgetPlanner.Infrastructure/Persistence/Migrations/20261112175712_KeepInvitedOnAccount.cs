using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class KeepInvitedOnAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "invitation_note",
                table: "users",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "invited",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // I-006: "Invited" and the note move from the link that created the account onto the account, so used links
            // can be deleted and the People page still shows them
            migrationBuilder.Sql(
                """
                UPDATE users AS u
                SET invited = TRUE, invitation_note = i.note
                FROM invitations AS i
                WHERE i.used_by_id = u.id AND i.created_account;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "invitation_note",
                table: "users");

            migrationBuilder.DropColumn(
                name: "invited",
                table: "users");
        }
    }
}
