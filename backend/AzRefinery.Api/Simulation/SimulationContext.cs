namespace AzRefinery.Api.Simulation;

public class SimulationContext
{
    public double Dt { get; init; }
    public DateTime SimulationTime { get; init; }
    public Random Random { get; init; } = new();

    public double Noise(double sigmaFraction = 0.005)
    {
        double u1 = 1.0 - Random.NextDouble();
        double u2 = 1.0 - Random.NextDouble();
        double z = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
        return z * sigmaFraction;
    }
}
