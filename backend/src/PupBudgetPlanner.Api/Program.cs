using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using PupBudgetPlanner.Api.Hosting;
using PupBudgetPlanner.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    // JSON only, so the OpenAPI document (and the generated frontend types) lists one content type.
    .AddControllers(options => options.Filters.Add(new ProducesAttribute("application/json")))
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration);

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
    app.MapOpenApi();
    app.UseHttpsRedirection();
}
else
{
    // Render redirects HTTP to HTTPS at its edge; HSTS tells browsers to skip the HTTP hop.
    app.UseHsts();
}

app.UseSpaStaticFiles();
app.UseAuthorization();
app.MapControllers();
app.MapSpaFallback();

await app.RunAsync();
