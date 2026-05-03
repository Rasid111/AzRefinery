using AzRefinery.Api.Hubs;
using AzRefinery.Api.Services;
using AzRefinery.Api.Simulation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<PlantSimulator>();
builder.Services.AddSingleton<HistoryStore>();
builder.Services.AddSingleton<AzRefinery.Api.Analytics.AnomalyDetector>();
builder.Services.AddSingleton<AzRefinery.Api.Analytics.RulEstimator>();
builder.Services.AddSingleton<AzRefinery.Api.Analytics.KpiCalculator>();
builder.Services.AddSingleton<AzRefinery.Api.Scenarios.ScenarioManager>();
builder.Services.AddHostedService<SimulationBackgroundService>();
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "AzRefinery API", Version = "v1" });
});

builder.Services.AddSignalR()
    .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Связка сценариев с симулятором — после построения контейнера.
{
    var plant = app.Services.GetRequiredService<PlantSimulator>();
    var scenarios = app.Services.GetRequiredService<AzRefinery.Api.Scenarios.ScenarioManager>();
    plant.OnTick = scenarios.TickAll;
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<PlantHub>("/hubs/plant");

app.Run();
