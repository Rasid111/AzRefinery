namespace AzRefinery.Api.Domain.Sensors;

public record TelemetryReading(string SensorId, DateTime Timestamp, double Value);
