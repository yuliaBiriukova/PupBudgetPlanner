namespace PupBudgetPlanner.Application.Accounts;

/// <summary>A person's accounts, own sources and banks (F-014). Implemented with EF Core in Infrastructure.</summary>
public interface IAccountService
{
    Task<AccountsOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>Adds the account, and its own source or bank when the name is new.</summary>
    Task<AccountItem> CreateAsync(Guid userId, SaveAccountRequest request, CancellationToken cancellationToken);

    /// <summary>Null when the person has no such account.</summary>
    Task<AccountItem?> UpdateAsync(
        Guid userId, Guid accountId, SaveAccountRequest request, CancellationToken cancellationToken);

    /// <summary>Takes it out of the totals and pickers; false when the person has no such account.</summary>
    Task<bool> ArchiveAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>Brings an archived account back; false when the person has no such account.</summary>
    Task<bool> RestoreAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>
    /// Removes the account for good (I-011); its own source and bank stay. False when the person has no such account.
    /// </summary>
    Task<bool> DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);
}
