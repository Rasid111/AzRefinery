using AzRefinery.Api.Dtos;
using AzRefinery.Api.Hubs;
using AzRefinery.Api.Simulation;
using Microsoft.AspNetCore.SignalR;

namespace AzRefinery.Api.Services;

public class SimulationBackgroundService : BackgroundService
{
    private readonly PlantSimulator _plant;
    private readonly HistoryStore _history;
    private readonly IHubContext<PlantHub> _hub;
    private readonly ILogger<SimulationBackgroundService> _log;
    private readonly int _tickMs;
    private readonly int _telemetryMs;

    public SimulationBackgroundService(
        PlantSimulator plant,
        HistoryStore history,
        IHubContext<PlantHub> hub,
        IConfiguration config,
        ILogger<SimulationBackgroundService> log)
    {
        _plant = plant;
        _history = history;
        _hub = hub;
        _log = log;
        _tickMs = config.GetValue("Simulation:TickRateMs", 100);
        _telemetryMs = config.GetValue("Simulation:TelemetryPushIntervalMs", 1000);
    }

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        _log.LogInformation("Simulation tick={TickMs}ms, telemetry push={PushMs}ms", _tickMs, _telemetryMs);
        var lastTelemetry = DateTime.UtcNow;

        while (!stop.IsCancellationRequested)
        {
            try
            {
                _plant.AdvanceToNow();

                var now = DateTime.UtcNow;
                if ((now - lastTelemetry).TotalMilliseconds >= _telemetryMs)
                {
                    var snap = BuildSnapshot();
                    RecordHistory(snap);
                    await _hub.Clients.All.SendAsync("TelemetryUpdate", snap, stop);
                    lastTelemetry = now;
                }
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Simulation tick failed");
            }

            await Task.Delay(_tickMs, stop);
        }
    }

    private TelemetryUpdateDto BuildSnapshot() => new(
        DateTime.UtcNow,
        _plant.SimulationTime,
        _plant.Equipment.Select(EquipmentSnapshotDto.From).ToList());

    private void RecordHistory(TelemetryUpdateDto snap)
    {
        foreach (var eq in _plant.Equipment)
            foreach (var s in eq.Sensors)
                _history.RecordReading(s.Id, snap.SimulationTime, s.CurrentValue);
    }
}
