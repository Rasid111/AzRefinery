using AzRefinery.Api.Analytics.Models;
using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Services;

namespace AzRefinery.Api.Analytics;

/// <summary>
/// Линейная регрессия по истории DegradationLevel — оценивает оставшийся ресурс.
/// Использует синтетический ряд "{equipmentId}-DEGRADATION" из HistoryStore.
/// </summary>
public class RulEstimator
{
    private const int MinSamples = 10;
    private const int LookbackPoints = 200;

    private readonly HistoryStore _history;

    public RulEstimator(HistoryStore history) => _history = history;

    public RulEstimate Estimate(Equipment equipment, DateTime simNow)
    {
        var series = _history.Query(
            $"{equipment.Id}-DEGRADATION",
            simNow.AddDays(-30), simNow, LookbackPoints);

        if (equipment.Status == EquipmentStatus.Failed)
        {
            return new RulEstimate(equipment.Id, true,
                RemainingHoursSimulated: 0,
                Confidence: 1.0,
                PredictedFailureTime: simNow,
                RecommendedMaintenanceTime: simNow,
                RecommendedAction: "Объект отказал — требуется немедленное обслуживание");
        }

        if (series.Count < MinSamples)
            return Unavailable(equipment.Id, "Недостаточно истории для прогноза");

        // Регрессия в координатах (Δсек, DegradationLevel).
        var t0 = series[0].Timestamp;
        double n = series.Count;
        double sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
        foreach (var r in series)
        {
            double x = (r.Timestamp - t0).TotalSeconds;
            double y = r.Value;
            sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y;
        }
        double meanX = sx / n;
        double meanY = sy / n;
        double cov = sxy - n * meanX * meanY;
        double varX = sxx - n * meanX * meanX;
        double varY = syy - n * meanY * meanY;

        if (varX < 1e-9)
            return Unavailable(equipment.Id, "Прогноз недоступен");

        double slope = cov / varX;          // dD / dSec
        double intercept = meanY - slope * meanX;

        if (slope <= 1e-9)
            return Unavailable(equipment.Id, "Состояние стабильное, деградация не растёт");

        double r2 = (varY < 1e-9) ? 0 : (cov * cov) / (varX * varY);
        double confidence = Math.Clamp(r2 * Math.Min(1.0, n / 50.0), 0.0, 0.99);

        double currentD = equipment.DegradationLevel;
        double remainingSec = (1.0 - currentD) / slope;
        if (remainingSec < 0 || double.IsInfinity(remainingSec))
            return Unavailable(equipment.Id, "Прогноз недоступен");

        double remainingHours = remainingSec / 3600.0;
        var failAt = simNow.AddSeconds(remainingSec);
        var maintAt = simNow.AddSeconds(remainingSec * 0.8);

        return new RulEstimate(
            equipment.Id, true,
            Math.Round(remainingHours, 1),
            Math.Round(confidence, 2),
            failAt, maintAt,
            BuildAction(equipment, remainingHours));
    }

    private static RulEstimate Unavailable(string id, string message) => new(
        id, false, 0, 0,
        PredictedFailureTime: DateTime.MinValue,
        RecommendedMaintenanceTime: DateTime.MinValue,
        RecommendedAction: message);

    private static string BuildAction(Equipment eq, double hours)
    {
        string baseAction = eq.Type switch
        {
            EquipmentType.FeedPump => "Запланировать замену подшипника",
            EquipmentType.HeatExchanger => "Запланировать промывку теплообменника",
            EquipmentType.DistillationColumn => "Запланировать инспекцию колонны",
            EquipmentType.CrudeTank => "Запланировать осмотр резервуара",
            EquipmentType.ProductTank => "Запланировать осмотр резервуара",
            _ => "Запланировать обслуживание"
        };
        if (hours < 24) return baseAction + " — срочно (< 24 ч)";
        if (hours < 168) return baseAction + " — в ближайшую неделю";
        return baseAction;
    }
}
