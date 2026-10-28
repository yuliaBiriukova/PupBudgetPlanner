using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace PupBudgetPlanner.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(ApplicationAssembly.Instance, ServiceLifetime.Singleton);

        return services;
    }
}
