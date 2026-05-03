using AzRefinery.Api.Dtos;
using AzRefinery.Api.Scenarios;
using Microsoft.AspNetCore.Mvc;

namespace AzRefinery.Api.Controllers;

[ApiController]
[Route("api/scenarios")]
public class ScenarioController : ControllerBase
{
    private readonly ScenarioManager _scenarios;

    public ScenarioController(ScenarioManager scenarios) => _scenarios = scenarios;

    [HttpGet]
    public ActionResult<IEnumerable<ScenarioDto>> GetAll()
    {
        var activeNames = _scenarios.Active().Select(s => s.Name).ToHashSet();
        return Ok(_scenarios.Available()
            .Select(s => ScenarioDto.From(s, activeNames.Contains(s.Name))));
    }

    [HttpGet("active")]
    public ActionResult<IEnumerable<ScenarioDto>> GetActive() =>
        Ok(_scenarios.Active().Select(s => ScenarioDto.From(s, true)));

    [HttpPost("{name}/trigger")]
    public ActionResult<ScenarioDto> Trigger(string name)
    {
        try
        {
            var scenario = _scenarios.Trigger(name);
            return Ok(ScenarioDto.From(scenario, true));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
    }

    [HttpPost("{name}/cancel")]
    public IActionResult Cancel(string name)
    {
        _scenarios.Cancel(name);
        return NoContent();
    }

    [HttpPost("reset")]
    public IActionResult Reset()
    {
        _scenarios.Reset();
        return NoContent();
    }
}
