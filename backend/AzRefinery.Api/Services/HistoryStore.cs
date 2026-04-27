using System.Collections.Concurrent;
using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Domain.Sensors;

namespace AzRefinery.Api.Services;

/// <summary>
/// In-memory ring buffer на каждый датчик. Лимит подобран под 24 часа при записи раз в реальную секунду.
/// </summary>
public class HistoryStore
{
    private const int MaxPointsPerSensor = 86_400;
    private const int MaxEvents = 5_000;

    private readonly ConcurrentDictionary<string, Deque<TelemetryReading>> _byId = new();
    private readonly Deque<EquipmentEvent> _events = new();
    private readonly object _eventsLock = new();

    public void RecordReading(string sensorId, DateTime simTime, double value)
    {
        var dq = _byId.GetOrAdd(sensorId, _ => new Deque<TelemetryReading>(MaxPointsPerSensor));
        dq.PushTrim(new TelemetryReading(sensorId, simTime, value));
    }

    public void RecordEvent(EquipmentEvent evt)
    {
        lock (_eventsLock)
        {
            _events.PushTrim(evt);
            while (_events.Count > MaxEvents) _events.PopFront();
        }
    }

    public IReadOnlyList<TelemetryReading> Query(string sensorId, DateTime from, DateTime to, int maxPoints)
    {
        if (!_byId.TryGetValue(sensorId, out var dq)) return Array.Empty<TelemetryReading>();
        var snap = dq.Snapshot();
        var filtered = snap.Where(r => r.Timestamp >= from && r.Timestamp <= to).ToList();
        if (filtered.Count <= maxPoints) return filtered;
        // Прореживание — берём каждую N-ю точку.
        int step = (int)Math.Ceiling(filtered.Count / (double)maxPoints);
        return filtered.Where((_, i) => i % step == 0).ToList();
    }

    public IReadOnlyList<EquipmentEvent> QueryEvents(string? equipmentId, DateTime from, DateTime to)
    {
        lock (_eventsLock)
        {
            return _events.Snapshot()
                .Where(e => (equipmentId == null || e.EquipmentId == equipmentId)
                            && e.Timestamp >= from && e.Timestamp <= to)
                .ToList();
        }
    }

    public void Clear()
    {
        _byId.Clear();
        lock (_eventsLock) _events.Clear();
    }
}

/// <summary>Простой потокобезопасный ring-deque фиксированной ёмкости.</summary>
internal sealed class Deque<T>
{
    private readonly LinkedList<T> _list = new();
    private readonly int _capacity;
    private readonly object _lock = new();

    public Deque(int capacity = int.MaxValue) => _capacity = capacity;

    public int Count { get { lock (_lock) return _list.Count; } }

    public void PushTrim(T item)
    {
        lock (_lock)
        {
            _list.AddLast(item);
            while (_list.Count > _capacity) _list.RemoveFirst();
        }
    }

    public void PopFront() { lock (_lock) if (_list.First != null) _list.RemoveFirst(); }
    public void Clear() { lock (_lock) _list.Clear(); }

    public List<T> Snapshot() { lock (_lock) return _list.ToList(); }
}
