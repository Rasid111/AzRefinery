using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Domain.Equipment;

public class ProductTank : Equipment
{
    public DistillationColumn UpstreamColumn { get; init; } = null!;
    /// <summary>Код датчика-источника на колонне (GASOLINE_DRAW и т.п.).</summary>
    public string SourceCode { get; init; } = "";
    public double VolumeM3 { get; init; } = 1000.0;
    public double ProductTemperatureC { get; init; } = 40.0;

    public override void Tick(SimulationContext ctx)
    {
        var levelS = GetSensor("LEVEL");
        var tempS = GetSensor("TEMPERATURE");

        double dtHours = ctx.Dt / 3600.0;
        double inflow = UpstreamColumn.GetSensor(SourceCode).CurrentValue;

        // Если резервуар почти полон — приём ограничен (имитация отгрузки).
        double level = levelS.CurrentValue;
        double offtake = level > 90 ? inflow : inflow * 0.5; // имитация отгрузки 50%
        double dLevel = (inflow - offtake) / VolumeM3 * 100.0 * dtHours;
        levelS.CurrentValue = Math.Clamp(level + dLevel, 0, 95);

        tempS.CurrentValue = ProductTemperatureC * (1.0 + ctx.Noise());

        StepDegradation(ctx.Dt);
    }
}
