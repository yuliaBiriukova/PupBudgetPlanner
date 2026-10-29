using FluentValidation;
using PupBudgetPlanner.Domain.Invitations;

namespace PupBudgetPlanner.Application.Access;

public sealed class CreateInvitationRequestValidator : AbstractValidator<CreateInvitationRequest>
{
    public CreateInvitationRequestValidator()
    {
        RuleFor(r => r.Note)
            .MaximumLength(Invitation.NoteMaxLength)
            .WithMessage($"Keep the note under {Invitation.NoteMaxLength} characters.");
    }
}

public sealed class PeopleRequestValidator : AbstractValidator<PeopleRequest>
{
    /// <summary>More than the app will have; keeps one request from touching the whole table.</summary>
    public const int MaxPeople = 200;

    public PeopleRequestValidator()
    {
        RuleFor(r => r.UserIds)
            .NotEmpty().WithMessage("Pick at least one person.")
            .Must(ids => ids.Count <= MaxPeople).WithMessage($"Pick at most {MaxPeople} people at a time.");
    }
}
