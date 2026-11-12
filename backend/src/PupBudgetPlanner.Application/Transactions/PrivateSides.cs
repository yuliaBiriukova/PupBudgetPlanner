using PupBudgetPlanner.Domain.Families;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// A transfer between a hidden account and one the viewer sees (F-030, "A private account"): the line stays on the
/// shown side and says nothing of the hidden one, not its id, name, currency or what it got.
/// </summary>
public static class PrivateSides
{
    /// <summary>The id a hidden side has: the app names it "A private account".</summary>
    public static readonly Guid PrivateAccountId = Guid.Empty;

    /// <summary>
    /// <paramref name="item"/> as the viewer may see it: a hidden To account gives the amount that left in its own
    /// currency, a hidden From account the amount that came in, in the To account's currency.
    /// </summary>
    public static TransactionItem SeenWith(this TransactionItem item, KeptFromFamily kept)
    {
        if (item.Type != TransactionType.Transfer || kept.IsNothing)
        {
            return item;
        }

        if (item.ToAccountId is { } toAccountId && !kept.Shows(toAccountId))
        {
            return item with
            {
                ToAccountId = PrivateAccountId,
                ToAccountName = string.Empty,
                ToCurrency = item.Currency,
                ToAmount = item.Amount,
            };
        }

        if (!kept.Shows(item.AccountId))
        {
            return item with
            {
                AccountId = PrivateAccountId,
                AccountName = string.Empty,
                Currency = item.ToCurrency ?? item.Currency,
                Amount = item.ToAmount ?? item.Amount,
            };
        }

        return item;
    }
}
