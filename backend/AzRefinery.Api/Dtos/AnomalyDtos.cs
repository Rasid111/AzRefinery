using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;

namespace AzRefinery.Api.Dtos;

public record AnomalyAlertDto(
    string Id,
    DateTime Timestamp,
    DateTime SimulationTime,
    string EquipmentId,
    string SensorId,
    string SensorCode,
    AnomalySeverity Severity,
    double ZScore,
    double CurrentValue,
    double[] ExpectedRange,
    string Message);

public record EquipmentStateChangeDto(
    DateTime Timestamp,
    DateTime SimulationTime,
    string EquipmentId,
    EquipmentStatus PreviousStatus,
    EquipmentStatus NewStatus,
    string Reason);

public record EquipmentEventDto(
    string Id,
    string EquipmentId,
    EventType Type,
    DateTime Timestamp,
    string Message,
    Dictionary<string, object>? Metadata)
{
    public static EquipmentEventDto From(EquipmentEvent e) =>
        new(e.Id, e.EquipmentId, e.Type, e.Timestamp, e.Message, e.Metadata);
}

public record TelemetryReadingDto(DateTime Timestamp, double Value);
