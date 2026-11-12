using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace PupBudgetPlanner.Api.Auth;

/// <summary>
/// Rejects requests that change something (POST, PUT, PATCH, DELETE) without a valid antiforgery header, with a
/// 400 ProblemDetails. MVC's own <c>AutoValidateAntiforgeryToken</c> needs the view services, which an API
/// doesn't register.
/// </summary>
public sealed class AntiforgeryFilter(IAntiforgery antiforgery) : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var method = context.HttpContext.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method))
        {
            return;
        }

        // An endpoint nobody calls with a cookie opts out with [RequireAntiforgeryToken(false)]: the clean-up (I-006)
        if (context.ActionDescriptor.EndpointMetadata.OfType<IAntiforgeryMetadata>().LastOrDefault() is
            { RequiresValidation: false })
        {
            return;
        }

        if (!await antiforgery.IsRequestValidAsync(context.HttpContext))
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "The request is missing its antiforgery token. Reload the page and try again.",
            })
            { StatusCode = StatusCodes.Status400BadRequest };
        }
    }
}
