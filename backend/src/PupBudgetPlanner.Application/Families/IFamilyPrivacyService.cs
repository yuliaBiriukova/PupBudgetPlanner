using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Application.Families;

/// <summary>
/// What the other members of the family see of a person's money (F-030), set on the Family page: all their
/// transactions or only the totals, each account's share, their private categories. A change counts at once, for
/// every member alike; nothing is deleted or moved. Each person sets only their own. Implemented with EF Core in
/// Infrastructure; <see cref="IFamilyService.ScopeAsync"/> reads it.
/// </summary>
public interface IFamilyPrivacyService
{
    Task ShareTransactionsAsync(Guid userId, TransactionShare share, CancellationToken cancellationToken);

    /// <summary>False when the person has no such account.</summary>
    Task<bool> ShareAccountAsync(Guid userId, Guid accountId, AccountShare share, CancellationToken cancellationToken);

    /// <summary>False when the person has no such category.</summary>
    Task<bool> KeepCategoryAsync(Guid userId, Guid categoryId, bool isPrivate, CancellationToken cancellationToken);
}
