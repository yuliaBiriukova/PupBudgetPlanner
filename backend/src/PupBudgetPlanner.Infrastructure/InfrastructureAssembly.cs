using System.Reflection;

namespace PupBudgetPlanner.Infrastructure;

/// <summary>Marker for the Infrastructure assembly (layer checks, assembly scanning).</summary>
public static class InfrastructureAssembly
{
    public static Assembly Instance => typeof(InfrastructureAssembly).Assembly;
}
