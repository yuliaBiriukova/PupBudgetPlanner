namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>
/// A source of the person's own besides Cash and Bank (Deposit, Crypto wallet, …), added in the account form and
/// offered for their next accounts. Only that person sees it (F-014).
/// </summary>
public sealed class AccountSource
{
    public const int NameMaxLength = 30;

    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public required string Name { get; init; }

    public static AccountSource Create(Guid userId, string name, DateTimeOffset now) => new()
    {
        Id = Guid.CreateVersion7(now),
        UserId = userId,
        Name = name.Trim(),
    };
}
