using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios.Implementations;

/// <summary>Утечка резервуара сырой нефти — 5% объёма в час симулированного времени.</summary>
public class CrudeTankLeakScenario : IScenario
{
    public string Name => "CrudeTankLeak";
    public string DisplayName => "Утечка из резервуара сырой нефти";
    public string Description => "TANK-CRUDE-01 теряет 5% объёма в час симулированного времени.";
    public string TargetEquipmentId => "TANK-CRUDE-01";

    public bool IsCompleted => false;
    private double _previousLeak;

    public void Apply(PlantSimulator plant)
    {
        var tank = (CrudeTank)plant.GetById(TargetEquipmentId);
        _previousLeak = tank.LeakRateM3H;
        // 5% объёма в час: VolumeM3 * 0.05
        tank.LeakRateM3H = tank.VolumeM3 * 0.05;
    }

    public void Tick(SimulationContext ctx, PlantSimulator plant) { }

    public void Cancel(PlantSimulator plant)
    {
        var tank = (CrudeTank)plant.GetById(TargetEquipmentId);
        tank.LeakRateM3H = _previousLeak;
    }
}
