using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Scenarios.Implementations;
using AzRefinery.Api.Services;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Scenarios;

/// <summary>
/// Реестр доступных сценариев и трекер активных. Тикается из SimulationBackgroundService.
/// </summary>
public class ScenarioManager
{
    private readonly object _lock = new();
    private readonly Dictionary<string, Func<IScenario>> _registry = new();
    private readonly Dictionary<string, IScenario> _active = new();

    private readonly PlantSimulator _plant;
    private readonly HistoryStore _history;

    public ScenarioManager(PlantSimulator plant, HistoryStore history)
    {
        _plant = plant;
        _history = history;
        Register(() => new PumpBearingWearScenario());
        Register(() => new HeatExchangerFoulingScenario());
        Register(() => new ColumnRefluxLossScenario());
        Register(() => new CrudeTankLeakScenario());
        Register(() => new PumpFilterClogScenario());
    }

    private void Register(Func<IScenario> factory)
    {
        var probe = factory();
        _registry[probe.Name] = factory;
    }

    public IReadOnlyList<IScenario> Available()
        => _registry.Values.Select(f => f()).ToList();

    public IReadOnlyList<IScenario> Active()
    {
        lock (_lock) return _active.Values.ToList();
    }

    public IScenario Trigger(string name)
    {
        lock (_lock)
        {
            if (!_registry.TryGetValue(name, out var factory))
                throw new KeyNotFoundException($"Сценарий '{name}' не найден");
            if (_active.ContainsKey(name))
                throw new InvalidOperationException($"Сценарий '{name}' уже активен");
            var scenario = factory();
            scenario.Apply(_plant);
            _active[name] = scenario;
            _history.RecordEvent(new EquipmentEvent
            {
                EquipmentId = scenario.TargetEquipmentId,
                Type = EventType.ScenarioTriggered,
                Timestamp = _plant.SimulationTime,
                Message = $"Запущен сценарий: {scenario.DisplayName}",
                Metadata = new Dictionary<string, object> { ["scenarioName"] = name },
            });
            return scenario;
        }
    }

    public void Cancel(string name)
    {
        lock (_lock)
        {
            if (!_active.TryGetValue(name, out var scenario)) return;
            scenario.Cancel(_plant);
            _active.Remove(name);
        }
    }

    public void Reset()
    {
        lock (_lock)
        {
            foreach (var sc in _active.Values) sc.Cancel(_plant);
            _active.Clear();
            // Сброс деградации всех объектов.
            foreach (var eq in _plant.Equipment) eq.PerformMaintenance();
        }
    }

    /// <summary>Вызывается из симулятора на каждом тике.</summary>
    public void TickAll(SimulationContext ctx)
    {
        lock (_lock)
        {
            foreach (var sc in _active.Values.ToList())
                sc.Tick(ctx, _plant);
        }
    }
}
