using AzRefinery.Api.Analytics.Models;

namespace AzRefinery.Api.Dtos;

public record RulEstimateDto(
    string EquipmentId,
    bool IsAvailable,
    double RemainingHoursSimulated,
    double Confidence,
    DateTime PredictedFailureTime,
    DateTime RecommendedMaintenanceTime,
    string RecommendedAction)
{
    public static RulEstimateDto From(RulEstimate r) => new(
        r.EquipmentId, r.IsAvailable, r.RemainingHoursSimulated, r.Confidence,
        r.PredictedFailureTime, r.RecommendedMaintenanceTime, r.RecommendedAction);
}

public record RulUpdateDto(DateTime Timestamp, List<RulEstimateDto> Estimates);

public record KpiUpdateDto(
    DateTime Timestamp,
    PlantKpis Plant,
    List<EquipmentKpis> Equipment);
