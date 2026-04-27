using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Dtos;

public record SimulationStateDto(
    DateTime SimulationTime,
    DateTime RealTime,
    DateTime RealStartTime,
    double TimeAcceleration,
    bool IsPaused)
{
    public static SimulationStateDto From(PlantSimulator p) => new(
        p.SimulationTime, DateTime.UtcNow, p.RealStartTime, p.TimeAcceleration, p.IsPaused);
}

public record AccelerationRequest(double Value);
