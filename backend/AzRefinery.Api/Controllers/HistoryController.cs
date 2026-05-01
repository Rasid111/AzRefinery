using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Dtos;
using AzRefinery.Api.Services;
using AzRefinery.Api.Simulation;
using Microsoft.AspNetCore.Mvc;

namespace AzRefinery.Api.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly HistoryStore _history;
    private readonly PlantSimulator _plant;

    public HistoryController(HistoryStore history, PlantSimulator plant)
    {
        _history = history;
        _plant = plant;
    }

    [HttpGet("sensor/{sensorId}")]
    public ActionResult<IEnumerable<TelemetryReadingDto>> GetSensorHistory(
        string sensorId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int maxPoints = 500)
    {
        var (f, t) = ResolveRange(from, to);
        var data = _history.Query(sensorId, f, t, Math.Clamp(maxPoints, 10, 5000));
        return Ok(data.Select(r => new TelemetryReadingDto(r.Timestamp, r.Value)));
    }

    [HttpGet("equipment/{id}/events")]
    public ActionResult<IEnumerable<EquipmentEventDto>> GetEquipmentEvents(
        string id,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try { _plant.GetById(id); }
        catch (KeyNotFoundException) { return NotFound(); }

        var (f, t) = ResolveRange(from, to);
        return Ok(_history.QueryEvents(id, f, t).Select(EquipmentEventDto.From));
    }

    [HttpGet("equipment/{id}/degradation")]
    public ActionResult<IEnumerable<TelemetryReadingDto>> GetDegradationHistory(
        string id,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int maxPoints = 500)
    {
        try { _plant.GetById(id); }
        catch (KeyNotFoundException) { return NotFound(); }

        var (f, t) = ResolveRange(from, to);
        var data = _history.Query($"{id}-DEGRADATION", f, t, Math.Clamp(maxPoints, 10, 5000));
        return Ok(data.Select(r => new TelemetryReadingDto(r.Timestamp, r.Value)));
    }

    [HttpGet("anomalies")]
    public ActionResult<IEnumerable<EquipmentEventDto>> GetAnomalies(
        [FromQuery] AnomalySeverity? severity,
        [FromQuery] string? equipmentId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var (f, t) = ResolveRange(from, to);
        var events = _history.QueryEvents(equipmentId, f, t)
            .Where(e => e.Type == EventType.AnomalyDetected);

        if (severity.HasValue)
        {
            var sev = severity.Value.ToString();
            events = events.Where(e =>
                e.Metadata != null
                && e.Metadata.TryGetValue("severity", out var s)
                && s?.ToString() == sev);
        }

        return Ok(events.Select(EquipmentEventDto.From));
    }

    private static (DateTime From, DateTime To) ResolveRange(DateTime? from, DateTime? to)
    {
        var t = to ?? DateTime.UtcNow.AddYears(100);
        var f = from ?? DateTime.MinValue;
        return (f, t);
    }
}
