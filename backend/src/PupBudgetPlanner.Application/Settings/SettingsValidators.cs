using FluentValidation;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Domain.Accounts;

namespace PupBudgetPlanner.Application.Settings;

public sealed class ChangeNameRequestValidator : AbstractValidator<ChangeNameRequest>
{
    public ChangeNameRequestValidator()
    {
        // The same rules as at sign-up, on the name as it is saved: trimmed
        RuleFor(r => r.DisplayName).Cascade(CascadeMode.Stop)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Enter your name.")
            .Must(name => name.Trim().Length <= AuthLimits.DisplayNameMaxLength)
            .WithMessage($"Use at most {AuthLimits.DisplayNameMaxLength} characters.");
    }
}

public sealed class ChangeReportCurrencyRequestValidator : AbstractValidator<ChangeReportCurrencyRequest>
{
    public ChangeReportCurrencyRequestValidator()
    {
        // Any currency an account can be in: the NBU publishes a rate for each (F-017)
        RuleFor(r => r.Currency)
            .Must(Currencies.IsKnown).WithMessage("Pick a currency from the list.");
    }
}
