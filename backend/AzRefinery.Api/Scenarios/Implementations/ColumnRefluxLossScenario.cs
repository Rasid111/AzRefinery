using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios.Implementations;

/// <summary>Резкое падение расхода орошения с 60 до 30 m³/h за 30 симулированных секунд.</summary>
public class ColumnRefluxLossScenario : IScenario
{
    public string Name => "ColumnRefluxLoss";
    public string DisplayName => "Потеря орошения колонны";
    public string Description => "Расход орошения COL-01 падает с 60 до 30 m³/h за 30 секунд — резкий рост температуры верха.";
    public string TargetEquipmentId => "COL-01";

    private const double TargetReflux = 30.0;
    private const double DurationSeconds = 30.0;

    private double _initialReflux = 60.0;
    private double _elapsed;
    private bool _completed;

    public bool IsCompleted => _completed;

    public void Apply(PlantSimulator plant)
    {
        var col = (DistillationColumn)plant.GetById(TargetEquipmentId);
        _initialReflux = col.Setpoints.GetValueOrDefault("REFLUX_FLOW", 60.0);
        _elapsed = 0;
        _completed = false;
    }

    public void Tick(SimulationContext ctx, PlantSimulator plant)
    {
        if (_completed) return;
        _elapsed += ctx.Dt;
        var col = (DistillationColumn)plant.GetById(TargetEquipmentId);
        double t = Math.Min(1.0, _elapsed / DurationSeconds);
        double reflux = _initialReflux + (TargetReflux - _initialReflux) * t;
        col.Setpoints["REFLUX_FLOW"] = reflux;
        if (t >= 1.0) _completed = true;
    }

    public void Cancel(PlantSimulator plant)
    {
        var col = (DistillationColumn)plant.GetById(TargetEquipmentId);
        col.Setpoints["REFLUX_FLOW"] = _initialReflux;
    }
}
