namespace PupBudgetPlanner.Application.Tests;

public sealed class LayerDependencyTests
{
    [Theory]
    [InlineData("PupBudgetPlanner.Infrastructure")]
    [InlineData("PupBudgetPlanner.Api")]
    public void Application_does_not_depend_on_outer_layers(string outerLayer)
    {
        var references = ApplicationAssembly.Instance.GetReferencedAssemblies().Select(reference => reference.Name);

        references.Should().NotContain(outerLayer);
    }
}
