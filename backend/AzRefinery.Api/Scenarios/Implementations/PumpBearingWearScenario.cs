using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios.Implementations;

/// <summary>Ускоренный износ подшипника насоса — ×50 к скорости деградации.</summary>
public class PumpBearingWearScenario : IScenario
{
    public string Name => "PumpBearingWear";
    public string DisplayName => "Износ подшипника насоса";
    public string Description => "Ускоренный износ подшипника PUMP-01: рост вибрации и температуры, рост деградации в 50 раз.";
    public string TargetEquipmentId => "PUMP-01";

    private double _previousMultiplier = 1.0;

    public bool IsCompleted => false;

    public void Apply(PlantSimulator plant)
    {
        var pump = plant.GetById(TargetEquipmentId);
        _previousMultiplier = pump.DegradationRateMultiplier;
        pump.DegradationRateMultiplier = 50.0;
    }

    public void Tick(SimulationContext ctx, PlantSimulator plant) { /* эффект встроен в множитель */ }

    public void Cancel(PlantSimulator plant)
    {
        var pump = plant.GetById(TargetEquipmentId);
        pump.DegradationRateMultiplier = _previousMultiplier;
    }
}
