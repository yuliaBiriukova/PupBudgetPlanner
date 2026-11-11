using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Domain.Categories;

namespace PupBudgetPlanner.Application.Tests.Categories;

/// <summary>Names and places of new and changed categories and groups (F-029).</summary>
public sealed class CategoryValidatorTests
{
    private static readonly Guid GroupId = Guid.CreateVersion7();

    [Fact]
    public void Filled_in_requests_are_valid()
    {
        new AddCategoryRequestValidator().Validate(new AddCategoryRequest(GroupId, "Pets", null)).IsValid
            .Should().BeTrue();
        new UpdateCategoryRequestValidator().Validate(new UpdateCategoryRequest("Pets", GroupId, 0)).IsValid
            .Should().BeTrue();
        new AddGroupRequestValidator().Validate(new AddGroupRequest(CategoryKind.Income, "Side jobs", 2)).IsValid
            .Should().BeTrue();
        new UpdateGroupRequestValidator().Validate(new UpdateGroupRequest("Home", null)).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Every_one_needs_a_name(string? name)
    {
        string[] noName = ["Type a name."];

        Errors(new AddCategoryRequestValidator().Validate(new AddCategoryRequest(GroupId, name!, null)))
            .Should().Equal(noName);
        Errors(new UpdateCategoryRequestValidator().Validate(new UpdateCategoryRequest(name!, GroupId, null)))
            .Should().Equal(noName);
        Errors(new AddGroupRequestValidator().Validate(new AddGroupRequest(CategoryKind.Expense, name!, null)))
            .Should().Equal(noName);
        Errors(new UpdateGroupRequestValidator().Validate(new UpdateGroupRequest(name!, null)))
            .Should().Equal(noName);
    }

    [Fact]
    public void Names_are_short_spaces_around_them_not_counted()
    {
        var longest = new string('a', Category.NameMaxLength);

        new AddCategoryRequestValidator().Validate(new AddCategoryRequest(GroupId, $"  {longest}  ", null)).IsValid
            .Should().BeTrue();
        Errors(new UpdateGroupRequestValidator().Validate(new UpdateGroupRequest(longest + "a", null)))
            .Should().Equal($"Use at most {CategoryGroup.NameMaxLength} characters.");
    }

    [Fact]
    public void A_place_counts_from_0_and_the_kind_is_known()
    {
        Errors(new UpdateCategoryRequestValidator().Validate(new UpdateCategoryRequest("Pets", GroupId, -1)))
            .Should().Equal("A place counts from 0.");
        new AddGroupRequestValidator().Validate(new AddGroupRequest((CategoryKind)7, "Pets", null)).IsValid
            .Should().BeFalse();
    }

    private static IEnumerable<string> Errors(FluentValidation.Results.ValidationResult result) =>
        result.Errors.Select(error => error.ErrorMessage);
}
