using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Domain.Sensors;

namespace AzRefinery.Api.Dtos;

public record SensorDto(
    string Id,
    string Code,
    SensorType Type,
    string Unit,
    double CurrentValue,
    double NominalValue,
    double MinValue,
    double MaxValue)
{
    public static SensorDto From(Sensor s) => new(
        s.Id, s.Code, s.Type, s.Unit,
        s.CurrentValue, s.NominalValue, s.MinValue, s.MaxValue);
}

public record EquipmentDto(
    string Id,
    string Name,
    EquipmentType Type,
    EquipmentStatus Status,
    double HealthIndex,
    double DegradationLevel,
    DateTime CommissionedAt,
    Dictionary<string, double> Setpoints,
    Dictionary<string, double> Readings,
    List<SensorDto> Sensors)
{
    public static EquipmentDto From(Domain.Equipment.Equipment e) => new(
        e.Id, e.Name, e.Type, e.Status,
        e.HealthIndex, e.DegradationLevel, e.CommissionedAt,
        new Dictionary<string, double>(e.Setpoints),
        e.GetCurrentReadings(),
        e.Sensors.Select(SensorDto.From).ToList()
    );
}

public record SetpointRequest(string Name, double Value);
public record DegradationDebugRequest(double Value);
