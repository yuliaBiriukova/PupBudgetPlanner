using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Api.Auth;
using PupBudgetPlanner.Api.Hosting;
using PupBudgetPlanner.Api.Validation;
using PupBudgetPlanner.Application;
using PupBudgetPlanner.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers(options =>
    {
        // JSON only, so the OpenAPI document (and the generated frontend types) lists one content type.
        options.Filters.Add(new ProducesAttribute("application/json"));
        // Requests that change something must carry the antiforgery header (cookie auth, ADR 0003)
        options.Filters.Add<AntiforgeryFilter>();
        options.Filters.Add<ValidationFilter>();
    })
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuth(builder.Configuration, builder.Environment);

// Render's proxy terminates HTTPS. Its addresses aren't fixed and the container is reachable only through it,
// so the headers are trusted from any address. Render keeps the original Host header.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

await app.Services.MigrateDatabaseAsync(app.Lifetime.ApplicationStopping);

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.UseHttpsRedirection();
}
else
{
    // Render redirects HTTP to HTTPS at its edge; HSTS tells browsers to skip the HTTP hop.
    app.UseHsts();
}

app.UseSpaStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapSpaFallback();

await app.RunAsync();
