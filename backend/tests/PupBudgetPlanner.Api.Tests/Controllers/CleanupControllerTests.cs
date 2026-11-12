using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Application.Cleanup;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class CleanupControllerTests
{
    private const string Secret = "a-long-random-secret-from-render";

    private readonly ICleanupService cleanup = Substitute.For<ICleanupService>();
    private readonly CleanupOptions options = new() { Secret = Secret };
    private readonly CleanupController controller;

    public CleanupControllerTests()
    {
        var services = new ServiceCollection().AddProblemDetails();
        services.AddMvcCore();
        var monitor = Substitute.For<IOptionsMonitor<CleanupOptions>>();
        monitor.CurrentValue.Returns(_ => options);
        controller = new CleanupController(cleanup, monitor, NullLogger<CleanupController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() },
            },
        };
    }

    [Fact]
    public async Task The_scheduler_with_the_secret_runs_it_and_hears_how_much_went()
    {
        cleanup.RunAsync(Arg.Any<CancellationToken>()).Returns(new CleanupReport(4));

        var result = await controller.Run(Secret, CancellationToken.None);

        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().Be(new CleanupReport(4));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("a-long-random-secret-from-rende")]
    [InlineData("a-long-random-secret-from-render ")]
    public async Task Anyone_without_the_secret_is_refused_and_nothing_is_deleted(string? given)
    {
        var result = await controller.Run(given, CancellationToken.None);

        (result.Result as ObjectResult)!.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        await cleanup.DidNotReceive().RunAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    public async Task Without_a_configured_secret_it_is_off(string? configured)
    {
        options.Secret = configured;

        (await controller.Run(configured, CancellationToken.None)).Result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        await cleanup.DidNotReceive().RunAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public void Nobody_signs_in_or_sends_an_antiforgery_token_and_it_is_rate_limited()
    {
        var type = typeof(CleanupController);
        type.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).Should().ContainSingle();
        type.GetCustomAttributes(typeof(RequireAntiforgeryTokenAttribute), inherit: true)
            .Should().ContainSingle().Which.Should().BeOfType<RequireAntiforgeryTokenAttribute>()
            .Which.RequiresValidation.Should().BeFalse();
        type.GetMethod(nameof(CleanupController.Run))!
            .GetCustomAttributes(typeof(EnableRateLimitingAttribute), inherit: false)
            .Should().ContainSingle().Which.Should().BeOfType<EnableRateLimitingAttribute>()
            .Which.PolicyName.Should().Be(AuthRateLimiting.PolicyName);
    }
}
