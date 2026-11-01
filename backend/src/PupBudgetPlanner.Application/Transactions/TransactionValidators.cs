using FluentValidation;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.ExchangeRates;
using PupBudgetPlanner.Domain;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// The form's rules (F-018). Whether the account and the category are the person's is checked when saving: that
/// needs the database.
/// </summary>
public sealed class SaveTransactionRequestValidator : AbstractValidator<SaveTransactionRequest>
{
    public SaveTransactionRequestValidator(TimeProvider clock)
    {
        RuleFor(r => r.Type).IsInEnum().WithMessage("Pick expense or income.");

        // No planned payments: the calendar stops at today, Kyiv's (owner, 2026-11-01)
        RuleFor(r => r.Date)
            .Must(date => date <= Kyiv.Today(clock)).WithMessage("Pick today or a day before it.");

        RuleFor(r => r.AccountId).NotEmpty().WithMessage("Pick an account.");
        RuleFor(r => r.CategoryId).NotEmpty().WithMessage("Pick a category.");

        // Cents are rounded when it is saved (Money.Whole), so it is above zero once rounded
        RuleFor(r => r.Amount).Cascade(CascadeMode.Stop)
            .Must(amount => Money.Whole(amount) > 0).WithMessage("The amount must be more than zero.")
            .Must(amount => Money.Whole(amount) <= SaveAccountRequestValidator.MaxAmount)
            .WithMessage("The amount is too big.");

        RuleFor(r => r.Note)
            .Must(note => note is null || note.Trim().Length <= Transaction.NoteMaxLength)
            .WithMessage($"Use at most {Transaction.NoteMaxLength} characters.");
    }
}
