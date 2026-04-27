namespace AzRefinery.Api.Simulation.DegradationModels;

public class LinearDegradation : IDegradationModel
{
    // Базовая скорость: 1% за 1000 симулированных часов = 0.01 / (1000 * 3600) per sec.
    public const double BaseRatePerSecond = 0.01 / (1000.0 * 3600.0);

    public double Step(double currentLevel, double dtSeconds, double rateMultiplier)
    {
        double next = currentLevel + BaseRatePerSecond * rateMultiplier * dtSeconds;
        return Math.Clamp(next, 0.0, 1.0);
    }
}
