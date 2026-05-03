using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios.Implementations;

/// <summary>Загрязнение теплообменника — ×30 к скорости деградации, эффективность падает.</summary>
public class HeatExchangerFoulingScenario : IScenario
{
    public string Name => "HeatExchangerFouling";
    public string DisplayName => "Загрязнение теплообменника";
    public string Description => "Постепенное загрязнение HEX-01 — снижение эффективности теплообмена, рост деградации в 30 раз.";
    public string TargetEquipmentId => "HEX-01";

    private double _previousMultiplier = 1.0;
    public bool IsCompleted => false;

    public void Apply(PlantSimulator plant)
    {
        var hex = plant.GetById(TargetEquipmentId);
        _previousMultiplier = hex.DegradationRateMultiplier;
        hex.DegradationRateMultiplier = 30.0;
    }

    public void Tick(SimulationContext ctx, PlantSimulator plant) { }

    public void Cancel(PlantSimulator plant)
    {
        var hex = plant.GetById(TargetEquipmentId);
        hex.DegradationRateMultiplier = _previousMultiplier;
    }
}
