using Microsoft.AspNetCore.Identity;
using NSubstitute;
using PupBudgetPlanner.Application.Settings;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Tests.Identity;

public sealed class SettingsServiceTests
{
    private readonly UserManager<AppUser> userManager = Substitute.For<UserManager<AppUser>>(
        Substitute.For<IUserStore<AppUser>>(), null, null, null, null, null, null, null, null);

    private readonly SettingsService service;
    private readonly AppUser olena = new()
    {
        Id = Guid.CreateVersion7(),
        UserName = "olena@example.com",
        Email = "olena@example.com",
        DisplayName = "Olena",
    };

    public SettingsServiceTests()
    {
        service = new SettingsService(userManager);
        userManager.FindByIdAsync(olena.Id.ToString()).Returns(olena);
        userManager.UpdateAsync(olena).Returns(IdentityResult.Success);
    }

    [Fact]
    public async Task A_new_account_starts_with_the_hryvnia()
    {
        var settings = await service.GetAsync(olena.Id, CancellationToken.None);

        settings.Should().Be(new UserSettings("Olena", "olena@example.com", "UAH"));
    }

    [Fact]
    public async Task The_name_is_saved_trimmed()
    {
        var settings = await service.ChangeNameAsync(
            olena.Id, new ChangeNameRequest("  Olena K.  "), CancellationToken.None);

        settings!.DisplayName.Should().Be("Olena K.");
        await userManager.Received(1).UpdateAsync(Arg.Is<AppUser>(user => user.DisplayName == "Olena K."));
    }

    [Fact]
    public async Task The_report_currency_is_saved()
    {
        var settings = await service.ChangeReportCurrencyAsync(
            olena.Id, new ChangeReportCurrencyRequest("PLN"), CancellationToken.None);

        settings!.ReportCurrency.Should().Be("PLN");
        await userManager.Received(1).UpdateAsync(Arg.Is<AppUser>(user => user.ReportCurrency == "PLN"));
    }

    [Fact]
    public async Task Nothing_is_saved_for_an_account_that_is_gone()
    {
        var gone = Guid.CreateVersion7();

        (await service.GetAsync(gone, CancellationToken.None)).Should().BeNull();
        (await service.ChangeReportCurrencyAsync(gone, new ChangeReportCurrencyRequest("USD"), CancellationToken.None))
            .Should().BeNull();
        await userManager.DidNotReceive().UpdateAsync(Arg.Any<AppUser>());
    }

    [Fact]
    public async Task A_failed_save_is_not_reported_as_saved()
    {
        userManager.UpdateAsync(olena).Returns(IdentityResult.Failed(new IdentityError { Code = "ConcurrencyFailure" }));

        var act = () => service.ChangeNameAsync(olena.Id, new ChangeNameRequest("Olena K."), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*ConcurrencyFailure*");
    }
}
