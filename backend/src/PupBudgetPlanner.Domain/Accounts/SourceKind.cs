namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>
/// Where an account's money is (F-014). Everyone has Cash and Bank; the app names them in the person's language.
/// Anything else is a source of the person's own (<see cref="AccountSource"/>).
/// </summary>
public enum SourceKind
{
    Cash,

    /// <summary>The account says which of the person's <see cref="Bank"/>s.</summary>
    Bank,

    /// <summary>The account says which of the person's own <see cref="AccountSource"/>s.</summary>
    Own,
}
