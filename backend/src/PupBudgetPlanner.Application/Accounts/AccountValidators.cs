using FluentValidation;
using PupBudgetPlanner.Domain;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.Accounts;

public sealed class SaveAccountRequestValidator : AbstractValidator<SaveAccountRequest>
{
    /// <summary>Money is <c>numeric(18,2)</c>: 16 digits before the point, in whole units (ADR 0018).</summary>
    public const decimal MaxAmount = 9_999_999_999_999_999m;

    public SaveAccountRequestValidator()
    {
        RuleFor(r => r.Name).Cascade(CascadeMode.Stop)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Give the account a name.")
            .Must(name => name.Trim().Length <= Account.NameMaxLength)
            .WithMessage($"Use at most {Account.NameMaxLength} characters.");

        RuleFor(r => r.Currency)
            .Must(Currencies.IsKnown).WithMessage("Pick a currency from the list.");

        RuleFor(r => r.Source).IsInEnum();

        When(r => r.Source == SourceKind.Own, () =>
            RuleFor(r => r.SourceName).Cascade(CascadeMode.Stop)
                .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Name the new source.")
                .Must(name => name!.Trim().Length <= AccountSource.NameMaxLength)
                .WithMessage($"Use at most {AccountSource.NameMaxLength} characters."));

        When(r => r.Source == SourceKind.Bank, () =>
            RuleFor(r => r.BankName).Cascade(CascadeMode.Stop)
                .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Pick your bank or type its name.")
                .Must(name => name!.Trim().Length <= Bank.NameMaxLength)
                .WithMessage($"Use at most {Bank.NameMaxLength} characters."));

        RuleFor(r => r.OpeningBalance)
            // Cents are rounded when the account is saved (Money.Whole), so any amount in range is fine
            .Must(amount => Math.Abs(Money.Whole(amount)) <= MaxAmount)
            .WithMessage("Enter an amount like 1240 or −300.");

        RuleFor(r => r.CardStyle).IsInEnum();
    }
}
