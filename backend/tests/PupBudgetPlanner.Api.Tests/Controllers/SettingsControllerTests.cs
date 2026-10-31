using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Settings;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class SettingsControllerTests
{
    private static readonly Guid UserId = Guid.CreateVersion7();
    private static readonly UserSettings Olena = new("Olena", "olena@example.com", "UAH");

    private readonly ISettingsService settings = Substitute.For<ISettingsService>();
    private readonly SettingsController controller;

    public SettingsControllerTests()
    {
        var person = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, UserId.ToString())], "cookie"));
        controller = new SettingsController(settings)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = person } },
        };
    }

    [Fact]
    public void It_needs_a_signed_in_person_like_every_endpoint()
    {
        typeof(SettingsController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .Should().BeEmpty();
    }

    [Fact]
    public async Task Get_returns_the_signed_in_persons_settings()
    {
        settings.GetAsync(UserId, Arg.Any<CancellationToken>()).Returns(Olena);

        (await controller.Get(CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(Olena);
    }

    [Fact]
    public async Task Changing_the_name_saves_it_for_the_signed_in_person_and_returns_the_settings()
    {
        var request = new ChangeNameRequest("Olena K.");
        var saved = Olena with { DisplayName = "Olena K." };
        settings.ChangeNameAsync(UserId, request, Arg.Any<CancellationToken>()).Returns(saved);

        (await controller.ChangeName(request, CancellationToken.None)).Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(saved);
    }

    [Fact]
    public async Task Changing_the_report_currency_saves_it_for_the_signed_in_person()
    {
        var request = new ChangeReportCurrencyRequest("PLN");
        var saved = Olena with { ReportCurrency = "PLN" };
        settings.ChangeReportCurrencyAsync(UserId, request, Arg.Any<CancellationToken>()).Returns(saved);

        (await controller.ChangeReportCurrency(request, CancellationToken.None)).Result
            .Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(saved);
    }

    [Fact]
    public async Task An_account_that_is_gone_is_not_found()
    {
        settings.GetAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSettings?)null);
        settings.ChangeNameAsync(UserId, Arg.Any<ChangeNameRequest>(), Arg.Any<CancellationToken>())
            .Returns((UserSettings?)null);

        (await controller.Get(CancellationToken.None)).Result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        (await controller.ChangeName(new ChangeNameRequest("Olena"), CancellationToken.None)).Result
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
