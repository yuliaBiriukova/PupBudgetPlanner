using FluentValidation;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Transactions;

/// <summary>
/// The Transactions page's filters (F-020), each one left out when it isn't set: the period (<paramref name="From"/>
/// and <paramref name="To"/>, both days included), one account (a transfer counts on its From and its To), one
/// category, one type.
/// </summary>
public sealed record TransactionFilter(
    DateOnly? From = null,
    DateOnly? To = null,
    Guid? AccountId = null,
    Guid? CategoryId = null,
    TransactionType? Type = null);

/// <summary>
/// A page of the list, newest day first and, within a day, the last added first. <paramref name="Next"/> is where the
/// next page starts (its <c>offset</c>); empty when this one is the last.
/// </summary>
public sealed record TransactionPage(IReadOnlyList<TransactionItem> Items, int? Next)
{
    /// <summary>The list loads 30 at a time as it is scrolled (F-020).</summary>
    public const int DefaultLimit = 30;

    public const int MaxLimit = 100;
}

public sealed class TransactionFilterValidator : AbstractValidator<TransactionFilter>
{
    public TransactionFilterValidator()
    {
        RuleFor(filter => filter.To)
            .Must((filter, to) => filter.From is null || to is null || filter.From <= to)
            .WithMessage("The period ends before it starts.");
        RuleFor(filter => filter.Type).IsInEnum().WithMessage("Pick expense, income or transfer.");
    }
}
