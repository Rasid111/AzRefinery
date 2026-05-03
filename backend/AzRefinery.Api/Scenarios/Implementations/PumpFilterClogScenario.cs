using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios.Implementations;

/// <summary>Засорение фильтра насоса — за 1 симулированный час давление всасывания падает на 2 bar.</summary>
public class PumpFilterClogScenario : IScenario
{
    public string Name => "PumpFilterClog";
    public string DisplayName => "Засорение фильтра насоса";
    public string Description => "PUMP-01: за 1 час симул. времени падение давления всасывания и расхода, рост вибрации.";
    public string TargetEquipmentId => "PUMP-01";

    private const double FinalDrop = 2.0; // bar
    private const double DurationSeconds = 3600.0;

    private double _initialDrop;
    private double _elapsed;
    private bool _completed;

    public bool IsCompleted => _completed;

    public void Apply(PlantSimulator plant)
    {
        var pump = (FeedPump)plant.GetById(TargetEquipmentId);
        _initialDrop = pump.SuctionPressureDrop;
        _elapsed = 0;
        _completed = false;
    }

    public void Tick(SimulationContext ctx, PlantSimulator plant)
    {
        if (_completed) return;
        _elapsed += ctx.Dt;
        double t = Math.Min(1.0, _elapsed / DurationSeconds);
        var pump = (FeedPump)plant.GetById(TargetEquipmentId);
        pump.SuctionPressureDrop = _initialDrop + (FinalDrop - _initialDrop) * t;
        if (t >= 1.0) _completed = true;
    }

    public void Cancel(PlantSimulator plant)
    {
        var pump = (FeedPump)plant.GetById(TargetEquipmentId);
        pump.SuctionPressureDrop = _initialDrop;
    }
}
