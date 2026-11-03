using PupBudgetPlanner.Application.Transactions;
using PupBudgetPlanner.Domain.Transactions;

namespace PupBudgetPlanner.Application.Tests.Transactions;

public sealed class TransactionFilterValidatorTests
{
    private readonly TransactionFilterValidator validator = new();

    [Fact]
    public void No_filters_or_any_of_them_are_fine()
    {
        validator.Validate(new TransactionFilter()).IsValid.Should().BeTrue();
        validator.Validate(new TransactionFilter(
                new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 31), Guid.CreateVersion7(), Guid.CreateVersion7(),
                TransactionType.Expense))
            .IsValid.Should().BeTrue();
        // One day: the calendar's picked day
        validator.Validate(new TransactionFilter(new DateOnly(2026, 10, 24), new DateOnly(2026, 10, 24)))
            .IsValid.Should().BeTrue();
    }

    [Fact]
    public void A_period_that_ends_before_it_starts_is_turned_down()
    {
        var result = validator.Validate(new TransactionFilter(new DateOnly(2026, 10, 31), new DateOnly(2026, 10, 1)));

        result.Errors.Should().ContainSingle().Which.PropertyName.Should().Be(nameof(TransactionFilter.To));
    }

    [Fact]
    public void An_unknown_type_is_turned_down()
    {
        validator.Validate(new TransactionFilter(Type: (TransactionType)7)).IsValid.Should().BeFalse();
    }
}
