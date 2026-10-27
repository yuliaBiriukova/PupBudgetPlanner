using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Api.Controllers;
using PupBudgetPlanner.Api.Health;

namespace PupBudgetPlanner.Api.Tests.Controllers;

public sealed class HealthControllerTests
{
    [Fact]
    public void Get_returns_ok_with_healthy_status()
    {
        var controller = new HealthController();

        var result = controller.Get();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(new HealthResponse("Healthy"));
    }

    [Fact]
    public void Health_controller_has_no_dependencies_so_it_cannot_touch_the_database()
    {
        var constructors = typeof(HealthController).GetConstructors();

        constructors.Should().ContainSingle().Which.GetParameters().Should().BeEmpty();
    }
}
