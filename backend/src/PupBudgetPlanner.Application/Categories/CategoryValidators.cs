using FluentValidation;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Categories;

/// <summary>The rules every name and place of a category or group follows (F-029).</summary>
internal static class CategoryRules
{
    public const string NoName = "Type a name.";

    public static void Name<T>(IRuleBuilderInitial<T, string> rule, int maxLength) =>
        rule.Cascade(CascadeMode.Stop)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage(NoName)
            .Must(name => name.Trim().Length <= maxLength).WithMessage($"Use at most {maxLength} characters.");

    public static void Place<T>(IRuleBuilderInitial<T, int?> rule) =>
        rule.GreaterThanOrEqualTo(0).WithMessage("A place counts from 0.");
}

public sealed class AddCategoryRequestValidator : AbstractValidator<AddCategoryRequest>
{
    public AddCategoryRequestValidator()
    {
        CategoryRules.Name(RuleFor(r => r.Name), Category.NameMaxLength);
        CategoryRules.Place(RuleFor(r => r.Place));
    }
}

public sealed class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        CategoryRules.Name(RuleFor(r => r.Name), Category.NameMaxLength);
        CategoryRules.Place(RuleFor(r => r.Place));
    }
}

public sealed class AddGroupRequestValidator : AbstractValidator<AddGroupRequest>
{
    public AddGroupRequestValidator()
    {
        RuleFor(r => r.Kind).IsInEnum();
        CategoryRules.Name(RuleFor(r => r.Name), CategoryGroup.NameMaxLength);
        CategoryRules.Place(RuleFor(r => r.Place));
    }
}

public sealed class UpdateGroupRequestValidator : AbstractValidator<UpdateGroupRequest>
{
    public UpdateGroupRequestValidator()
    {
        CategoryRules.Name(RuleFor(r => r.Name), CategoryGroup.NameMaxLength);
        CategoryRules.Place(RuleFor(r => r.Place));
    }
}
