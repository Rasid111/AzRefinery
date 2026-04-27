namespace AzRefinery.Api.Domain.Sensors;

public class Sensor
{
    public string Id { get; init; } = "";
    public string EquipmentId { get; init; } = "";
    public string Code { get; init; } = "";
    public SensorType Type { get; init; }
    public string Unit { get; init; } = "";
    public double CurrentValue { get; set; }
    public double NominalValue { get; init; }
    public double MinValue { get; init; }
    public double MaxValue { get; init; }
}
