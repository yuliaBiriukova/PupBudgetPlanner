using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Reminders;
using PupBudgetPlanner.Infrastructure.Identity;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.Property(subscription => subscription.Endpoint).HasMaxLength(PushSubscription.EndpointMaxLength);
        builder.Property(subscription => subscription.P256dh).HasMaxLength(PushSubscription.KeyMaxLength);
        builder.Property(subscription => subscription.Auth).HasMaxLength(PushSubscription.KeyMaxLength);

        // One row a device
        builder.HasIndex(subscription => subscription.Endpoint).IsUnique();

        // A person's devices go with their account
        builder.HasOne<AppUser>().WithMany().HasForeignKey(subscription => subscription.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
