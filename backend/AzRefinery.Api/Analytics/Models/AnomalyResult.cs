using AzRefinery.Api.Domain.Events;

namespace AzRefinery.Api.Analytics.Models;

public record AnomalyResult(
    bool IsAnomaly,
    double ZScore,
    double Mean,
    double StdDev,
    AnomalySeverity Severity)
{
    public static AnomalyResult None => new(false, 0, 0, 0, AnomalySeverity.Info);
}
