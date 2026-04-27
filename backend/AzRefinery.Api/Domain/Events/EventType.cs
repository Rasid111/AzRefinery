namespace AzRefinery.Api.Domain.Events;

public enum EventType
{
    StatusChange,
    AnomalyDetected,
    SetpointChanged,
    MaintenancePerformed,
    ScenarioTriggered,
    Failure
}

public enum AnomalySeverity
{
    Info,
    Warning,
    Critical
}
