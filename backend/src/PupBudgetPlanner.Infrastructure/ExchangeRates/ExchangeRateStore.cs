using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Domain.ExchangeRates;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.ExchangeRates;

/// <summary>The rates kept in the database, one day at a time.</summary>
internal interface IExchangeRateStore
{
    /// <summary>The day's rates by currency; empty when none are kept for it.</summary>
    Task<IReadOnlyDictionary<string, decimal>> OnAsync(DateOnly date, CancellationToken cancellationToken);

    /// <summary>The latest day before <paramref name="date"/> with rates kept, or null.</summary>
    Task<DateOnly?> LatestBeforeAsync(DateOnly date, CancellationToken cancellationToken);

    Task SaveAsync(DateOnly date, IReadOnlyList<NbuRate> rates, CancellationToken cancellationToken);
}

internal sealed class ExchangeRateStore(AppDbContext dbContext) : IExchangeRateStore
{
    public async Task<IReadOnlyDictionary<string, decimal>> OnAsync(DateOnly date, CancellationToken cancellationToken) =>
        await dbContext.ExchangeRates.AsNoTracking()
            .Where(rate => rate.Date == date)
            .ToDictionaryAsync(rate => rate.Currency, rate => rate.RateToUah, StringComparer.Ordinal, cancellationToken);

    public Task<DateOnly?> LatestBeforeAsync(DateOnly date, CancellationToken cancellationToken) =>
        dbContext.ExchangeRates.AsNoTracking()
            .Where(rate => rate.Date < date)
            .MaxAsync(rate => (DateOnly?)rate.Date, cancellationToken);

    public async Task SaveAsync(DateOnly date, IReadOnlyList<NbuRate> rates, CancellationToken cancellationToken)
    {
        dbContext.ExchangeRates.AddRange(rates.Select(rate => new ExchangeRate
        {
            Date = date,
            Currency = rate.Currency,
            RateToUah = rate.RateToUah,
            Source = RateSource.Nbu,
        }));
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
