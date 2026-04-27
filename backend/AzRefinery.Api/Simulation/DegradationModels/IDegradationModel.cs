namespace AzRefinery.Api.Simulation.DegradationModels;

public interface IDegradationModel
{
    double Step(double currentLevel, double dtSeconds, double rateMultiplier);
}
