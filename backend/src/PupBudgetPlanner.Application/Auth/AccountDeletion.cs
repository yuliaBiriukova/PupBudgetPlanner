using FluentValidation;

namespace PupBudgetPlanner.Application.Auth;

/// <summary>
/// What deleting one's own account would take away, and how it is confirmed (F-027): the counts said in the
/// confirmation, whether the person confirms with a password (or else with Google), and whether they may delete it at
/// all (the admin can't).
/// </summary>
public sealed record DeletionSummary(
    int Accounts,
    int Transactions,
    int Categories,
    bool HasPassword,
    bool CanDelete,
    bool GoogleConfirmed);

/// <summary>
/// Delete my account: the typed word, the password (someone with one) and, for a family's owner with others, who looks
/// after the family next.
/// </summary>
public sealed record DeleteMyAccountRequest(string Word, string? Password, Guid? NewOwnerId);

public enum DeleteMyAccountOutcome
{
    Deleted,
    NotFound,

    /// <summary>The admin can't delete their own account: without them nobody could be invited.</summary>
    IsAdmin,

    WrongWord,
    PasswordNeeded,
    WrongPassword,

    /// <summary>Too many wrong passwords: the same lockout as signing in.</summary>
    LockedOut,

    /// <summary>Someone with only Google hasn't signed in with it again in the last few minutes.</summary>
    GoogleNotConfirmed,

    NewOwnerNeeded,
    NoSuchNewOwner,
}

/// <summary>Deleting one's own account (F-027). Implemented with ASP.NET Core Identity in Infrastructure.</summary>
public interface IAccountDeletionService
{
    /// <summary>Null when the person has no account (any more).</summary>
    Task<DeletionSummary?> SummaryAsync(Guid userId, bool googleConfirmed, CancellationToken cancellationToken);

    /// <summary>
    /// Whether the Google login that has just come back belongs to <paramref name="userId"/>; clears it either way, so
    /// it signs nobody in.
    /// </summary>
    Task<bool> IsOwnGoogleLoginAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Checks the confirmation, takes the person out of their family and deletes the account with everything in it in
    /// one transaction. <paramref name="googleConfirmed"/>: they signed in with Google again a moment ago.
    /// </summary>
    Task<DeleteMyAccountOutcome> DeleteAsync(
        Guid userId, DeleteMyAccountRequest request, bool googleConfirmed, CancellationToken cancellationToken);
}

/// <summary>The rules of the confirmation, apart from the database (F-027).</summary>
public static class AccountDeletionRules
{
    /// <summary>The word typed to confirm; any letter case counts.</summary>
    public const string Word = "DELETE";

    /// <summary>How long signing in with Google again counts as confirmation.</summary>
    public static readonly TimeSpan GoogleConfirmationLifetime = TimeSpan.FromMinutes(10);

    public static bool IsWord(string? typed) =>
        string.Equals(typed?.Trim(), Word, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// What stops the deletion before the password is checked, or null when nothing does: the admin, the word, the
    /// password missing, Google not signed in again. The family is the family's to say (Family.Leave).
    /// </summary>
    public static DeleteMyAccountOutcome? Refusal(
        bool isAdmin, bool hasPassword, DeleteMyAccountRequest request, bool googleConfirmed)
    {
        if (isAdmin)
        {
            return DeleteMyAccountOutcome.IsAdmin;
        }

        if (!IsWord(request.Word))
        {
            return DeleteMyAccountOutcome.WrongWord;
        }

        if (hasPassword)
        {
            return string.IsNullOrEmpty(request.Password) ? DeleteMyAccountOutcome.PasswordNeeded : null;
        }

        return googleConfirmed ? null : DeleteMyAccountOutcome.GoogleNotConfirmed;
    }
}

public sealed class DeleteMyAccountRequestValidator : AbstractValidator<DeleteMyAccountRequest>
{
    public DeleteMyAccountRequestValidator()
    {
        RuleFor(r => r.Word).Must(AccountDeletionRules.IsWord)
            .WithMessage($"Type {AccountDeletionRules.Word} to confirm.");
        RuleFor(r => r.Password).MaximumLength(AuthLimits.PasswordMaxLength);
    }
}
