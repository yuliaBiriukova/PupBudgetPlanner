namespace PupBudgetPlanner.Domain.Jars;

/// <summary>A jar's money on one account: in the jar's currency and in the account's.</summary>
public sealed record JarPlace(Guid AccountId, decimal Amount, decimal AccountAmount);

/// <summary>
/// Where jar money lies and what of an account is free (F-034). Pure, so it is tested without a database.
/// </summary>
public static class JarMoney
{
    /// <summary>What is in the jar: everything put in less everything taken out, in its currency.</summary>
    public static decimal SavedIn(IEnumerable<JarMove> moves) => moves.Sum(move => move.Amount);

    /// <summary>A jar's money per account, biggest first; accounts it all went back to are left out.</summary>
    public static IReadOnlyList<JarPlace> PlacesOf(IEnumerable<JarMove> moves) =>
        moves
            .GroupBy(move => move.AccountId)
            .Select(group => new JarPlace(
                group.Key, group.Sum(move => move.Amount), group.Sum(move => move.AccountAmount)))
            .Where(place => place.Amount != 0 || place.AccountAmount != 0)
            .OrderByDescending(place => place.Amount)
            .ToList();

    /// <summary>
    /// What of each account is in jars, in the account's currency, from the moves of the jars still open (a closed
    /// jar's money is free again).
    /// </summary>
    public static IReadOnlyDictionary<Guid, decimal> InJarsOf(IEnumerable<JarMove> openJarsMoves) =>
        openJarsMoves
            .GroupBy(move => move.AccountId)
            .ToDictionary(group => group.Key, group => group.Sum(move => move.AccountAmount));

    /// <summary>
    /// What leaves the account's jar money when <paramref name="amount"/> of the jar's currency is taken out of
    /// <paramref name="place"/>: its share of the account amount, so taking out everything leaves nothing behind even
    /// when the money went in at another rate.
    /// </summary>
    public static decimal AccountShareOf(JarPlace place, decimal amount)
    {
        if (amount >= place.Amount || place.Amount == 0)
        {
            return place.AccountAmount;
        }

        return Money.Whole(amount * place.AccountAmount / place.Amount);
    }
}
