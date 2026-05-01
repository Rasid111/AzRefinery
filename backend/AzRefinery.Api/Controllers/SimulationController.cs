using AzRefinery.Api.Analytics;
using AzRefinery.Api.Dtos;
using AzRefinery.Api.Hubs;
using AzRefinery.Api.Services;
using AzRefinery.Api.Simulation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AzRefinery.Api.Controllers;

[ApiController]
[Route("api/simulation")]
public class SimulationController : ControllerBase
{
    private readonly PlantSimulator _plant;
    private readonly HistoryStore _history;
    private readonly AnomalyDetector _detector;
    private readonly IHubContext<PlantHub> _hub;

    public SimulationController(PlantSimulator plant, HistoryStore history, AnomalyDetector detector, IHubContext<PlantHub> hub)
    {
        _plant = plant;
        _history = history;
        _detector = detector;
        _hub = hub;
    }

    [HttpGet("state")]
    public ActionResult<SimulationStateDto> GetState()
    {
        _plant.AdvanceToNow();
        return Ok(SimulationStateDto.From(_plant));
    }

    [HttpPost("acceleration")]
    public async Task<ActionResult<SimulationStateDto>> SetAcceleration([FromBody] AccelerationRequest req)
    {
        if (req.Value < 0.1 || req.Value > 10000)
            return BadRequest("Value must be in [0.1, 10000]");

        _plant.AdvanceToNow();
        _plant.SetTimeAcceleration(req.Value);
        return await BroadcastAndReturn();
    }

    [HttpPost("pause")]
    public async Task<ActionResult<SimulationStateDto>> Pause()
    {
        _plant.AdvanceToNow();
        _plant.Pause();
        return await BroadcastAndReturn();
    }

    [HttpPost("resume")]
    public async Task<ActionResult<SimulationStateDto>> Resume()
    {
        _plant.Resume();
        return await BroadcastAndReturn();
    }

    [HttpPost("reset")]
    public async Task<ActionResult<SimulationStateDto>> Reset()
    {
        _plant.Reset();
        _history.Clear();
        _detector.Reset();
        return await BroadcastAndReturn();
    }

    private async Task<ActionResult<SimulationStateDto>> BroadcastAndReturn()
    {
        var state = SimulationStateDto.From(_plant);
        await _hub.Clients.All.SendAsync("SimulationStateChange", state);
        return Ok(state);
    }
}
