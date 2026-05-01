using AzRefinery.Api.Analytics;
using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Dtos;
using AzRefinery.Api.Hubs;
using AzRefinery.Api.Simulation;
using Microsoft.AspNetCore.SignalR;

namespace AzRefinery.Api.Services;

public class SimulationBackgroundService : BackgroundService
{
    private readonly PlantSimulator _plant;
    private readonly HistoryStore _history;
    private readonly AnomalyDetector _detector;
    private readonly IHubContext<PlantHub> _hub;
    private readonly ILogger<SimulationBackgroundService> _log;
    private readonly int _tickMs;
    private readonly int _telemetryMs;

    private readonly Dictionary<string, EquipmentStatus> _lastStatus = new();

    public SimulationBackgroundService(
        PlantSimulator plant,
        HistoryStore history,
        AnomalyDetector detector,
        IHubContext<PlantHub> hub,
        IConfiguration config,
        ILogger<SimulationBackgroundService> log)
    {
        _plant = plant;
        _history = history;
        _detector = detector;
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

                    await DetectAnomaliesAsync(snap, stop);
                    await DetectStatusChangesAsync(snap, stop);

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
        {
            foreach (var s in eq.Sensors)
                _history.RecordReading(s.Id, snap.SimulationTime, s.CurrentValue);
            // Деградация — синтетический временной ряд для графика на странице объекта.
            _history.RecordReading($"{eq.Id}-DEGRADATION", snap.SimulationTime, eq.DegradationLevel);
        }
    }

    private async Task DetectAnomaliesAsync(TelemetryUpdateDto snap, CancellationToken ct)
    {
        foreach (var eq in _plant.Equipment)
        {
            // Не проверяем остановленные / отказавшие — там значения сжаты к нулю и Z-score
            // станет шумом, который мешает осмысленным алертам.
            if (eq.Status == EquipmentStatus.Stopped || eq.Status == EquipmentStatus.Failed)
                continue;

            foreach (var sensor in eq.Sensors)
            {
                var res = _detector.Check(sensor.Id, sensor.CurrentValue);
                if (!res.IsAnomaly) continue;

                var alert = new AnomalyAlertDto(
                    Id: Guid.NewGuid().ToString(),
                    Timestamp: snap.Timestamp,
                    SimulationTime: snap.SimulationTime,
                    EquipmentId: eq.Id,
                    SensorId: sensor.Id,
                    SensorCode: sensor.Code,
                    Severity: res.Severity,
                    ZScore: Math.Round(res.ZScore, 2),
                    CurrentValue: Math.Round(sensor.CurrentValue, 3),
                    ExpectedRange: new[]
                    {
                        Math.Round(res.Mean - 3 * res.StdDev, 3),
                        Math.Round(res.Mean + 3 * res.StdDev, 3),
                    },
                    Message: $"{sensor.Code}: |Z|={Math.Abs(res.ZScore):F2}, " +
                             $"значение {sensor.CurrentValue:F2} {sensor.Unit} " +
                             $"вне диапазона [{res.Mean - 3 * res.StdDev:F2}; {res.Mean + 3 * res.StdDev:F2}]");

                _history.RecordEvent(new EquipmentEvent
                {
                    Id = alert.Id,
                    EquipmentId = eq.Id,
                    Type = EventType.AnomalyDetected,
                    Timestamp = snap.SimulationTime,
                    Message = alert.Message,
                    Metadata = new Dictionary<string, object>
                    {
                        ["sensorId"] = sensor.Id,
                        ["sensorCode"] = sensor.Code,
                        ["severity"] = res.Severity.ToString(),
                        ["zScore"] = alert.ZScore,
                        ["currentValue"] = alert.CurrentValue,
                        ["expectedRange"] = alert.ExpectedRange,
                    },
                });

                await _hub.Clients.All.SendAsync("AnomalyAlert", alert, ct);

                // Поднимаем статус оборудования по серьёзности аномалии (но не понижаем).
                if (res.Severity == AnomalySeverity.Critical && eq.Status == EquipmentStatus.Running)
                    eq.Status = EquipmentStatus.Critical;
                else if (res.Severity == AnomalySeverity.Warning && eq.Status == EquipmentStatus.Running)
                    eq.Status = EquipmentStatus.Warning;
            }
        }
    }

    private async Task DetectStatusChangesAsync(TelemetryUpdateDto snap, CancellationToken ct)
    {
        foreach (var eq in _plant.Equipment)
        {
            if (!_lastStatus.TryGetValue(eq.Id, out var prev))
            {
                _lastStatus[eq.Id] = eq.Status;
                continue;
            }
            if (prev == eq.Status) continue;

            var change = new EquipmentStateChangeDto(
                snap.Timestamp, snap.SimulationTime, eq.Id, prev, eq.Status,
                Reason: BuildStatusChangeReason(prev, eq.Status));

            _history.RecordEvent(new EquipmentEvent
            {
                EquipmentId = eq.Id,
                Type = eq.Status == EquipmentStatus.Failed ? EventType.Failure : EventType.StatusChange,
                Timestamp = snap.SimulationTime,
                Message = $"{prev} → {eq.Status}",
                Metadata = new Dictionary<string, object>
                {
                    ["previousStatus"] = prev.ToString(),
                    ["newStatus"] = eq.Status.ToString(),
                },
            });

            await _hub.Clients.All.SendAsync("EquipmentStateChange", change, ct);
            _lastStatus[eq.Id] = eq.Status;
        }
    }

    private static string BuildStatusChangeReason(EquipmentStatus prev, EquipmentStatus next) => next switch
    {
        EquipmentStatus.Failed => "Достигнут предельный уровень деградации",
        EquipmentStatus.Critical => "Критические отклонения параметров",
        EquipmentStatus.Warning => "Отклонения параметров от нормы",
        EquipmentStatus.Running when prev == EquipmentStatus.Failed => "Восстановлен после обслуживания",
        EquipmentStatus.Running => "Возврат в нормальный режим",
        EquipmentStatus.Stopped => "Остановлен оператором",
        _ => $"{prev} → {next}",
    };
}
