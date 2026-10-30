namespace PupBudgetPlanner.Domain.Accounts;

/// <summary>
/// One of the person's banks (Monobank, PrivatBank, …): typed in the account form the first time and offered for
/// their next accounts. Banks are personal: one person's banks are not another's (F-014).
/// </summary>
public sealed class Bank
{
    public const int NameMaxLength = 40;

    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public required string Name { get; init; }

    public static Bank Create(Guid userId, string name, DateTimeOffset now) => new()
    {
        Id = Guid.CreateVersion7(now),
        UserId = userId,
        Name = name.Trim(),
    };
}
