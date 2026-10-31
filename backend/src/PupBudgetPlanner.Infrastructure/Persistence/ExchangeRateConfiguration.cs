using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PupBudgetPlanner.Domain.Accounts;
using PupBudgetPlanner.Domain.ExchangeRates;

namespace PupBudgetPlanner.Infrastructure.Persistence;

internal sealed class ExchangeRateConfiguration : IEntityTypeConfiguration<ExchangeRate>
{
    /// <summary>Longest <see cref="RateSource"/> name, stored as text (ARCHITECTURE.md "Enums").</summary>
    private const int EnumMaxLength = 20;

    public void Configure(EntityTypeBuilder<ExchangeRate> builder)
    {
        // One rate per currency and day; a day's rates are read together, so the date leads the key
        builder.HasKey(rate => new { rate.Date, rate.Currency });
        builder.Property(rate => rate.Currency).HasMaxLength(Currencies.CodeLength).IsFixedLength();
        builder.Property(rate => rate.RateToUah).HasPrecision(18, ExchangeRate.Decimals);
        builder.Property(rate => rate.Source).HasConversion<string>().HasMaxLength(EnumMaxLength);
    }
}
