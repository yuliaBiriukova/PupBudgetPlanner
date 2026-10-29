using PupBudgetPlanner.Infrastructure.Access;

namespace PupBudgetPlanner.Infrastructure.Tests.Access;

public sealed class InvitationTokenTests
{
    [Fact]
    public void A_token_is_43_url_safe_characters_and_never_repeats()
    {
        var tokens = Enumerable.Range(0, 100).Select(_ => InvitationToken.New()).ToList();

        tokens.Should().OnlyHaveUniqueItems();
        tokens.Should().AllSatisfy(token =>
        {
            token.Should().HaveLength(43);
            token.Should().MatchRegex("^[A-Za-z0-9_-]+$");
        });
    }

    [Fact]
    public void The_stored_hash_is_sha256_of_the_token_and_ignores_stray_spaces()
    {
        var token = InvitationToken.New();

        InvitationToken.Hash(token).Should().HaveCount(32);
        InvitationToken.Hash($" {token} ").Should().Equal(InvitationToken.Hash(token));
        InvitationToken.Hash(InvitationToken.New()).Should().NotEqual(InvitationToken.Hash(token));
    }
}
