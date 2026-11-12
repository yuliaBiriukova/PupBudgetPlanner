using System.Linq.Expressions;
using FluentValidation;
using PupBudgetPlanner.Application.Auth;
using PupBudgetPlanner.Domain.Families;

namespace PupBudgetPlanner.Application.Families;

/// <summary>A family's name, as it is saved: trimmed, not empty, at most <see cref="Family.NameMaxLength"/>.</summary>
internal static class FamilyNameRules
{
    public static void ForName<T>(this AbstractValidator<T> validator, Expression<Func<T, string>> name) =>
        validator.RuleFor(name).Cascade(CascadeMode.Stop)
            .Must(value => !string.IsNullOrWhiteSpace(value)).WithMessage("Give the family a name.")
            .Must(value => value.Trim().Length <= Family.NameMaxLength)
            .WithMessage($"Use at most {Family.NameMaxLength} characters.");
}

public sealed class StartFamilyRequestValidator : AbstractValidator<StartFamilyRequest>
{
    public StartFamilyRequestValidator() => this.ForName(r => r.Name);
}

public sealed class RenameFamilyRequestValidator : AbstractValidator<RenameFamilyRequest>
{
    public RenameFamilyRequestValidator() => this.ForName(r => r.Name);
}

public sealed class ShareTransactionsRequestValidator : AbstractValidator<ShareTransactionsRequest>
{
    public ShareTransactionsRequestValidator()
    {
        RuleFor(r => r.Share).IsInEnum();
    }
}

public sealed class ShareAccountRequestValidator : AbstractValidator<ShareAccountRequest>
{
    public ShareAccountRequestValidator()
    {
        RuleFor(r => r.Share).IsInEnum();
    }
}

public sealed class JoinFamilyRequestValidator : AbstractValidator<JoinFamilyRequest>
{
    public JoinFamilyRequestValidator()
    {
        RuleFor(r => r.Token).NotEmpty().MaximumLength(AuthLimits.InviteTokenMaxLength);
    }
}
