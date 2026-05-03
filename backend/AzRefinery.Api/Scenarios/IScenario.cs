using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios;

public interface IScenario
{
    /// <summary>Уникальный программный идентификатор (используется в URL).</summary>
    string Name { get; }
    string DisplayName { get; }
    string Description { get; }
    string TargetEquipmentId { get; }

    /// <summary>Применить эффект к симулятору при запуске.</summary>
    void Apply(PlantSimulator plant);

    /// <summary>Тиковая логика, вызывается на каждом шаге пока сценарий активен.</summary>
    void Tick(SimulationContext ctx, PlantSimulator plant);

    /// <summary>Откатить эффект (вернуть исходные параметры).</summary>
    void Cancel(PlantSimulator plant);

    /// <summary>Завершён ли сценарий (например, эффект полностью применён).</summary>
    bool IsCompleted { get; }
}
