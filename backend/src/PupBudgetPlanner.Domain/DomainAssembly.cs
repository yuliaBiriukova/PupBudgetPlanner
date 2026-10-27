using System.Reflection;

namespace PupBudgetPlanner.Domain;

/// <summary>Marker for the Domain assembly (layer checks, assembly scanning).</summary>
public static class DomainAssembly
{
    public static Assembly Instance => typeof(DomainAssembly).Assembly;
}
