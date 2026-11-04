using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PupBudgetPlanner.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// No two accounts in use alike (I-020): a unique index on the person, the name ignoring case, the currency, the
    /// source and its own source or bank, for the accounts not archived. Cash has neither an own source nor a bank, so
    /// empty ones count as equal (<c>NULLS NOT DISTINCT</c>, PostgreSQL 15). Copies made before this change stay as
    /// they are: when there are any, the index isn't made and a warning says so, rather than failing the deploy or
    /// changing anyone's accounts; the service's own check still stops new copies.
    /// </summary>
    public partial class NoCopiesOfAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM accounts
                        WHERE archived_at IS NULL
                        GROUP BY user_id, lower(name), currency, source, source_id, bank_id
                        HAVING count(*) > 1
                    ) THEN
                        RAISE WARNING 'I-020: accounts in use that are copies of each other exist; ix_accounts_no_copies_in_use was not made.';
                    ELSE
                        CREATE UNIQUE INDEX ix_accounts_no_copies_in_use
                            ON accounts (user_id, lower(name), currency, source, source_id, bank_id) NULLS NOT DISTINCT
                            WHERE archived_at IS NULL;
                    END IF;
                END
                $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_accounts_no_copies_in_use;");
        }
    }
}
