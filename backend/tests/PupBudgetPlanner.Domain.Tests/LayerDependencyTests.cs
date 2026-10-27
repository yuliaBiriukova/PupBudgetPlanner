namespace PupBudgetPlanner.Domain.Tests;

public sealed class LayerDependencyTests
{
    [Fact]
    public void Domain_does_not_depend_on_other_layers()
    {
        var references = DomainAssembly.Instance.GetReferencedAssemblies().Select(reference => reference.Name);

        references.Should().NotContain(name => name!.StartsWith("PupBudgetPlanner.", StringComparison.Ordinal));
    }
}
