using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PupBudgetPlanner.Application.Cleanup;
using PupBudgetPlanner.Domain.Invitations;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Cleanup;

/// <summary>
/// The morning clean-up (I-006, ADR 0033): for now, invite links that stopped working more than
/// <see cref="CleanupOptions.InvitationsKeptFor"/> ago. Each kind of outdated data is one DELETE by its date, so a
/// second run deletes nothing more and a missed morning is caught up by the next one.
/// </summary>
internal sealed partial class CleanupService(
    AppDbContext dbContext,
    IOptions<CleanupOptions> options,
    TimeProvider clock,
    ILogger<CleanupService> logger) : ICleanupService
{
    public async Task<CleanupReport> RunAsync(CancellationToken cancellationToken)
    {
        var cutoff = clock.GetUtcNow() - options.Value.InvitationsKeptFor;
        var invitations = await dbContext.Invitations
            .Where(Invitation.StoppedBefore(cutoff))
            .ExecuteDeleteAsync(cancellationToken);

        LogDeleted(invitations, cutoff);
        return new CleanupReport(invitations);
    }

    [LoggerMessage(Level = LogLevel.Information,
        Message = "Morning clean-up: deleted {Invitations} invite links that stopped working before {Cutoff:O}")]
    private partial void LogDeleted(int invitations, DateTimeOffset cutoff);
}
