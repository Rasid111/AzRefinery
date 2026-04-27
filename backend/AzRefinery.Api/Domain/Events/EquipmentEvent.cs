namespace AzRefinery.Api.Domain.Events;

public class EquipmentEvent
{
    public string Id { get; init; } = Guid.NewGuid().ToString();
    public string EquipmentId { get; init; } = "";
    public EventType Type { get; init; }
    public DateTime Timestamp { get; init; }
    public string Message { get; init; } = "";
    public Dictionary<string, object>? Metadata { get; init; }
}
