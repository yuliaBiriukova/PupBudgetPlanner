using System.Reflection;

namespace PupBudgetPlanner.Application;

/// <summary>Marker for the Application assembly (layer checks, assembly scanning).</summary>
public static class ApplicationAssembly
{
    public static Assembly Instance => typeof(ApplicationAssembly).Assembly;
}
