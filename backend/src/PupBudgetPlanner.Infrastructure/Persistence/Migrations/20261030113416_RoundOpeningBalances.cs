using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Amounts are whole units from now on (ADR 0018): opening balances saved with cents before (only in test
    /// databases; F-014 isn't released) are rounded like <c>Money.Whole</c>. PostgreSQL's <c>round</c> on
    /// <c>numeric</c> rounds half away from zero, as <c>MidpointRounding.AwayFromZero</c> does.
    /// </summary>
    public partial class RoundOpeningBalances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE accounts SET opening_balance = round(opening_balance) WHERE opening_balance <> round(opening_balance);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The cents are gone; nothing to bring back
        }
    }
}
