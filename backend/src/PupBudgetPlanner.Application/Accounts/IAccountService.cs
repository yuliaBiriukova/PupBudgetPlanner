namespace PupBudgetPlanner.Application.Accounts;

/// <summary>A person's accounts, own sources and banks (F-014). Implemented with EF Core in Infrastructure.</summary>
public interface IAccountService
{
    Task<AccountsOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// The accounts in use together in the report currency at today's NBU rates (F-017), apart from the overview so
    /// the page doesn't wait for the NBU.
    /// </summary>
    Task<AccountsTotal> TotalAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>Adds the account, and its own source or bank when the name is new.</summary>
    Task<AccountItem> CreateAsync(Guid userId, SaveAccountRequest request, CancellationToken cancellationToken);

    /// <summary>Its currency stays once it has transactions.</summary>
    Task<UpdateAccountResult> UpdateAsync(
        Guid userId, Guid accountId, SaveAccountRequest request, CancellationToken cancellationToken);

    /// <summary>Takes it out of the totals and pickers; false when the person has no such account.</summary>
    Task<bool> ArchiveAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>Brings an archived account back; false when the person has no such account.</summary>
    Task<bool> RestoreAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>
    /// Removes the account for good (I-011); its own source and bank stay. Only an account without transactions.
    /// </summary>
    Task<DeleteAccountOutcome> DeleteAsync(Guid userId, Guid accountId, CancellationToken cancellationToken);
}
