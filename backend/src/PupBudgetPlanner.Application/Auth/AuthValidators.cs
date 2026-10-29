using FluentValidation;

namespace PupBudgetPlanner.Application.Auth;

/// <summary>Limits shared by the validators, Identity's options and the database columns.</summary>
public static class AuthLimits
{
    public const int DisplayNameMaxLength = 50;

    /// <summary>Identity's own column length for emails and user names.</summary>
    public const int EmailMaxLength = 256;

    /// <summary>Length is the rule; no required digits or symbols (NIST SP 800-63B).</summary>
    public const int PasswordMinLength = 8;

    /// <summary>Keeps hashing cheap for absurdly long inputs.</summary>
    public const int PasswordMaxLength = 128;

    /// <summary>A token is 43 characters (32 bytes, base64url); anything much longer is not one.</summary>
    public const int InviteTokenMaxLength = 100;
}

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(r => r.DisplayName)
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Enter your name.")
            .MaximumLength(AuthLimits.DisplayNameMaxLength);

        RuleFor(r => r.Email).ValidEmail();

        RuleFor(r => r.Password)
            .MinimumLength(AuthLimits.PasswordMinLength)
            .WithMessage($"Use at least {AuthLimits.PasswordMinLength} characters.")
            .MaximumLength(AuthLimits.PasswordMaxLength);

        RuleFor(r => r.InviteToken).MaximumLength(AuthLimits.InviteTokenMaxLength);
    }
}

public sealed class SignInRequestValidator : AbstractValidator<SignInRequest>
{
    public SignInRequestValidator()
    {
        RuleFor(r => r.Email).ValidEmail();

        // Only presence: the rules for a new password don't apply to old ones
        RuleFor(r => r.Password)
            .NotEmpty().WithMessage("Enter your password.")
            .MaximumLength(AuthLimits.PasswordMaxLength);
    }
}

internal static class AuthRules
{
    public static IRuleBuilderOptions<T, string> ValidEmail<T>(this IRuleBuilderInitial<T, string> rule) =>
        // One message at a time: an empty email is only "Enter your email."
        rule
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Enter your email.")
            .MaximumLength(AuthLimits.EmailMaxLength)
            .EmailAddress().WithMessage("Enter an email like name@example.com.");
}
