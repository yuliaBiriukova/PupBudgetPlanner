using FluentValidation;
using PupBudgetPlanner.Application.Accounts;
using PupBudgetPlanner.Application.Budgets;
using PupBudgetPlanner.Domain;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.Jars;

namespace PupBudgetPlanner.Application.Jars;

/// <summary>A jar's name, picture and currency; a goal above zero and a month written <c>yyyy-MM</c>, both optional.</summary>
public sealed class SaveJarRequestValidator : AbstractValidator<SaveJarRequest>
{
    public const int LastYear = 2100;

    public SaveJarRequestValidator()
    {
        RuleFor(r => r.Name).Cascade(CascadeMode.Stop)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Give the jar a name.")
            .Must(name => name.Trim().Length <= Jar.NameMaxLength)
            .WithMessage($"Use at most {Jar.NameMaxLength} characters.");
        RuleFor(r => r.Icon).IsInEnum();
        RuleFor(r => r.Color).IsInEnum();
        RuleFor(r => r.Currency).Must(Currencies.IsKnown).WithMessage("Pick a currency from the list.");
        RuleFor(r => r.Goal!.Value).Cascade(CascadeMode.Stop)
            .Must(goal => Money.Whole(goal) > 0).WithMessage("The goal must be more than zero.")
            .Must(goal => Money.Whole(goal) <= SaveAccountRequestValidator.MaxAmount).WithMessage("The goal is too big.")
            .OverridePropertyName(nameof(SaveJarRequest.Goal))
            .When(r => r.Goal is not null);
        RuleFor(r => r.By)
            .Must(by => BudgetMonths.Parse(by) is { } month && month.Year >= BudgetMonths.FirstYear && month.Year <= LastYear)
            .WithMessage("Write the month as yyyy-MM, e.g. 2027-12.")
            .When(r => r.By is not null);
        RuleFor(r => r.Note)
            .Must(note => note!.Trim().Length <= Jar.NoteMaxLength)
            .WithMessage($"Use at most {Jar.NoteMaxLength} characters.")
            .When(r => r.Note is not null);
    }
}

/// <summary>A whole amount above zero; a move names the other jar.</summary>
public sealed class JarMoveRequestValidator : AbstractValidator<JarMoveRequest>
{
    public JarMoveRequestValidator()
    {
        RuleFor(r => r.Action).IsInEnum();
        RuleFor(r => r.Amount).Cascade(CascadeMode.Stop)
            .Must(amount => Money.Whole(amount) > 0).WithMessage("Enter an amount like 5000.")
            .Must(amount => Money.Whole(amount) <= SaveAccountRequestValidator.MaxAmount)
            .WithMessage("The amount is too big.");
        RuleFor(r => r.ToJarId).NotNull().WithMessage("Pick the jar to move the money to.")
            .When(r => r.Action == JarMoveAction.Move);
    }
}

/// <summary>A month up to this one, at least one part, each a whole amount above zero, a jar once.</summary>
public sealed class SavedMoneyRequestValidator : AbstractValidator<SavedMoneyRequest>
{
    public const int MaxParts = 50;

    public SavedMoneyRequestValidator(TimeProvider clock)
    {
        RuleFor(r => r.Month).ValidMonth(clock);
        RuleFor(r => r.Way).IsInEnum();
        RuleFor(r => r.Parts).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Put an amount into at least one jar.")
            .Must(parts => parts.Count <= MaxParts).WithMessage($"At most {MaxParts} jars at a time.")
            .Must(parts => parts.Select(part => part.JarId).Distinct().Count() == parts.Count)
            .WithMessage("Each jar once.");
        RuleForEach(r => r.Parts).ChildRules(part =>
            part.RuleFor(p => p.Amount).Cascade(CascadeMode.Stop)
                .Must(amount => Money.Whole(amount) > 0).WithMessage("Enter an amount like 5000.")
                .Must(amount => Money.Whole(amount) <= SaveAccountRequestValidator.MaxAmount)
                .WithMessage("The amount is too big."));
    }
}
