using Microsoft.EntityFrameworkCore;
using PupBudgetPlanner.Application.Categories;
using PupBudgetPlanner.Infrastructure.Persistence;

namespace PupBudgetPlanner.Infrastructure.Categories;

internal sealed class CategoryService(AppDbContext dbContext) : ICategoryService
{
    public async Task<CategoriesOverview> OverviewAsync(Guid userId, CancellationToken cancellationToken)
    {
        var groups = await dbContext.CategoryGroups.AsNoTracking()
            .Where(group => group.UserId == userId)
            .Include(group => group.Categories)
            .ToListAsync(cancellationToken);

        return CategoriesOverview.From(groups);
    }
}
