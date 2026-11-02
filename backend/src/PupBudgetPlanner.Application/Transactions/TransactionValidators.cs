using FluentValidation;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// The form's rules (F-018, transfers F-019). Whether the accounts and the category are the person's, and whether a
/// transfer is between two currencies (then it needs what the To account got), is checked when saving: that needs the
/// database.
/// </summary>
public sealed class SaveTransactionRequestValidator : AbstractValidator<SaveTransactionRequest>
{
    public SaveTransactionRequestValidator(TimeProvider clock)
    {
        RuleFor(r => r.Type).IsInEnum().WithMessage("Pick expense, income or transfer.");

        // No planned payments: the calendar stops at today, Kyiv's (owner, 2026-11-01)
        RuleFor(r => r.Date)
            .Must(date => date <= Kyiv.Today(clock)).WithMessage("Pick today or a day before it.");

        RuleFor(r => r.AccountId).NotEmpty().WithMessage("Pick an account.");
        RuleFor(r => r.CategoryId).Must(Picked).WithMessage("Pick a category.")
            .When(r => r.Type != TransactionType.Transfer);

        // A transfer moves money between two of the person's accounts: no category, and the To account another one
        When(r => r.Type == TransactionType.Transfer, () =>
        {
            RuleFor(r => r.CategoryId).Null().WithMessage("A transfer has no category.");
            RuleFor(r => r.ToAccountId).Cascade(CascadeMode.Stop)
                .Must(Picked).WithMessage("Pick the account the money goes to.")
                .Must((r, to) => to != r.AccountId).WithMessage("Pick another account to move the money to.");
            RuleFor(r => r.ToAmount!.Value).Cascade(CascadeMode.Stop)
                .Must(amount => Money.Whole(amount) > 0).WithMessage("The amount must be more than zero.")
                .Must(amount => Money.Whole(amount) <= SaveAccountRequestValidator.MaxAmount)
                .WithMessage("The amount is too big.")
                .OverridePropertyName(nameof(SaveTransactionRequest.ToAmount))
                .When(r => r.ToAmount is not null);
        }).Otherwise(() =>
        {
            RuleFor(r => r.ToAccountId).Null().WithMessage("Only a transfer goes to another account.");
            RuleFor(r => r.ToAmount).Null().WithMessage("Only a transfer goes to another account.");
        });

        // Cents are rounded when it is saved (Money.Whole), so it is above zero once rounded
        RuleFor(r => r.Amount).Cascade(CascadeMode.Stop)
            .Must(amount => Money.Whole(amount) > 0).WithMessage("The amount must be more than zero.")
            .Must(amount => Money.Whole(amount) <= SaveAccountRequestValidator.MaxAmount)
            .WithMessage("The amount is too big.");

        RuleFor(r => r.Note)
            .Must(note => note is null || note.Trim().Length <= Transaction.NoteMaxLength)
            .WithMessage($"Use at most {Transaction.NoteMaxLength} characters.");
    }

    /// <summary>A nullable id is picked when it is there and not the empty one.</summary>
    private static bool Picked(Guid? id) => id is { } value && value != Guid.Empty;
}
