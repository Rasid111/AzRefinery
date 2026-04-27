namespace AzRefinery.Api.Simulation.DegradationModels;

public class ExponentialDegradation : IDegradationModel
{
    public double Step(double currentLevel, double dtSeconds, double rateMultiplier)
    {
        // Скорость растёт по мере приближения D к 1: rate ~ base * (1 + 4*D).
        double accel = 1.0 + 4.0 * currentLevel;
        double next = currentLevel + LinearDegradation.BaseRatePerSecond * rateMultiplier * accel * dtSeconds;
        return Math.Clamp(next, 0.0, 1.0);
    }
}
