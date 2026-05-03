namespace AzRefinery.Api.Analytics.Models;

public record RulEstimate(
    string EquipmentId,
    bool IsAvailable,
    double RemainingHoursSimulated,
    double Confidence,
    DateTime PredictedFailureTime,
    DateTime RecommendedMaintenanceTime,
    string RecommendedAction);
