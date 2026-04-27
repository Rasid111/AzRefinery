using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Dtos;
using AzRefinery.Api.Simulation;
using Microsoft.AspNetCore.Mvc;

namespace AzRefinery.Api.Controllers;

[ApiController]
[Route("api/equipment")]
public class EquipmentController : ControllerBase
{
    private readonly PlantSimulator _plant;

    public EquipmentController(PlantSimulator plant) => _plant = plant;

    [HttpGet]
    public ActionResult<IEnumerable<EquipmentDto>> GetAll()
    {
        _plant.AdvanceToNow();
        return Ok(_plant.Equipment.Select(EquipmentDto.From));
    }

    [HttpGet("{id}")]
    public ActionResult<EquipmentDto> Get(string id)
    {
        _plant.AdvanceToNow();
        try { return Ok(EquipmentDto.From(_plant.GetById(id))); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("{id}/sensors")]
    public ActionResult<IEnumerable<SensorDto>> GetSensors(string id)
    {
        _plant.AdvanceToNow();
        try
        {
            return Ok(_plant.GetById(id).Sensors.Select(SensorDto.From));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/setpoints")]
    public IActionResult SetSetpoint(string id, [FromBody] SetpointRequest req)
    {
        try
        {
            _plant.ApplySetpoint(id, req.Name, req.Value);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/start")]
    public IActionResult Start(string id)
    {
        try
        {
            var e = _plant.GetById(id);
            if (e.Status == EquipmentStatus.Failed)
                return Conflict("Объект в состоянии Failed — требуется обслуживание");
            e.Status = EquipmentStatus.Running;
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/stop")]
    public IActionResult Stop(string id)
    {
        try
        {
            _plant.GetById(id).Status = EquipmentStatus.Stopped;
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/maintenance")]
    public IActionResult Maintenance(string id)
    {
        try
        {
            _plant.PerformMaintenance(id);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Только для отладки: принудительно установить уровень деградации.</summary>
    [HttpPost("{id}/debug/degradation")]
    public IActionResult SetDegradation(string id, [FromBody] DegradationDebugRequest req)
    {
        if (req.Value < 0 || req.Value > 1)
            return BadRequest("Value must be in [0, 1]");
        try
        {
            var e = _plant.GetById(id);
            e.DegradationLevel = req.Value;
            e.HealthIndex = (1 - req.Value) * 100;
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
