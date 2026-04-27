using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;

namespace AzRefinery.Api.Dtos;

public record EquipmentSnapshotDto(
    string Id,
    EquipmentStatus Status,
    double HealthIndex,
    double DegradationLevel,
    Dictionary<string, double> Sensors)
{
    public static EquipmentSnapshotDto From(Equipment e) => new(
        e.Id, e.Status,
        Math.Round(e.HealthIndex, 2),
        Math.Round(e.DegradationLevel, 4),
        e.GetCurrentReadings().ToDictionary(kv => kv.Key, kv => Math.Round(kv.Value, 3)));
}

public record TelemetryUpdateDto(
    DateTime Timestamp,
    DateTime SimulationTime,
    List<EquipmentSnapshotDto> Equipment);
