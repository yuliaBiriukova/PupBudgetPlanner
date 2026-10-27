using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Api.Health;

namespace PupBudgetPlanner.Api.Controllers;

/// <summary>
/// Liveness check for the keep-awake ping and Render. Must not touch the database,
/// so the pings don't wake the Neon compute.
/// </summary>
[ApiController]
[Route("api/health")]
[AllowAnonymous]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> Get() => Ok(HealthResponse.Healthy);
}
