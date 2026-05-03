using AzRefinery.Api.Analytics.Models;
using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Services;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Analytics;

/// <summary>
/// Считает OEE и связанные KPI на основе текущего состояния симулятора и истории событий.
/// Простые формулы — намеренно, для прозрачности (см. CLAUDE.md, раздел 3.7).
/// </summary>
public class KpiCalculator
{
    private readonly PlantSimulator _plant;
    private readonly HistoryStore _history;

    public KpiCalculator(PlantSimulator plant, HistoryStore history)
    {
        _plant = plant;
        _history = history;
    }

    public PlantKpis CalculatePlant()
    {
        var simNow = _plant.SimulationTime;
        var window = TimeSpan.FromHours(24);
        var from = simNow - window;

        // Availability: доля оборудования, работающего «сейчас» (Running/Warning).
        // Performance: текущая производительность колонны / номинал (150 m³/h).
        // Quality: доля времени без Critical/Failed за окно (по событиям).
        var equipment = _plant.Equipment.ToList();
        int total = equipment.Count;
        int up = equipment.Count(e =>
            e.Status == EquipmentStatus.Running ||
            e.Status == EquipmentStatus.Warning);
        double availability = total == 0 ? 0 : (double)up / total * 100.0;

        var col = equipment.OfType<DistillationColumn>().FirstOrDefault();
        double throughput = 0;
        if (col != null)
        {
            throughput = DistillationColumn.CutFractions
                .Sum(cf => col.GetSensor(cf.Code).CurrentValue);
        }
        double nominal = 150.0;
        double performance = Math.Clamp(throughput / nominal * 100.0, 0, 100);

        // Quality: для каждого объекта смотрим время в Critical/Failed по событиям StatusChange/Failure.
        double qualityFraction = ComputeQualityFraction(equipment, from, simNow);
        double quality = qualityFraction * 100.0;

        double oee = availability / 100.0 * performance / 100.0 * quality / 100.0 * 100.0;

        var (mtbf, mttr) = ComputeMtbfMttr(from, simNow);

        return new PlantKpis(
            Oee: Math.Round(oee, 1),
            Availability: Math.Round(availability, 1),
            Performance: Math.Round(performance, 1),
            Quality: Math.Round(quality, 1),
            Throughput: Math.Round(throughput, 1),
            MtbfHours: Math.Round(mtbf, 1),
            MttrHours: Math.Round(mttr, 1),
            CalculatedAt: DateTime.UtcNow);
    }

    public List<EquipmentKpis> CalculateEquipment()
    {
        return _plant.Equipment.Select(e => new EquipmentKpis(
            EquipmentId: e.Id,
            Oee: Math.Round(e.HealthIndex * StatusFactor(e.Status) / 100.0 * 100.0, 1),
            Availability: e.Status switch
            {
                EquipmentStatus.Running => 100.0,
                EquipmentStatus.Warning => 95.0,
                EquipmentStatus.Critical => 70.0,
                EquipmentStatus.Stopped => 0.0,
                EquipmentStatus.Failed => 0.0,
                _ => 0.0,
            },
            HealthIndex: Math.Round(e.HealthIndex, 1)
        )).ToList();
    }

    private static double StatusFactor(EquipmentStatus s) => s switch
    {
        EquipmentStatus.Running => 1.0,
        EquipmentStatus.Warning => 0.9,
        EquipmentStatus.Critical => 0.6,
        EquipmentStatus.Stopped => 0.0,
        EquipmentStatus.Failed => 0.0,
        _ => 0.0,
    };

    private double ComputeQualityFraction(List<Equipment> equipment, DateTime from, DateTime to)
    {
        // Аппроксимация: для каждого объекта считаем долю времени, когда он был в Critical/Failed.
        // Берём из событий StatusChange/Failure; если событий нет — считаем по текущему статусу.
        double totalFraction = 0;
        var span = (to - from).TotalSeconds;
        if (span <= 0) return 1.0;

        foreach (var eq in equipment)
        {
            var events = _history.QueryEvents(eq.Id, from, to)
                .Where(e => e.Type == EventType.StatusChange || e.Type == EventType.Failure)
                .OrderBy(e => e.Timestamp)
                .ToList();

            // Текущий «в моменте» статус используем, если событий не было.
            if (events.Count == 0)
            {
                bool ok = eq.Status == EquipmentStatus.Running || eq.Status == EquipmentStatus.Warning;
                totalFraction += ok ? 1.0 : 0.0;
                continue;
            }

            // Грубо: доля времени = (события Failure ↑ счётчик плохого времени до следующего Running).
            double badSeconds = 0;
            DateTime? badStart = null;
            foreach (var e in events)
            {
                var newStatus = e.Metadata != null && e.Metadata.TryGetValue("newStatus", out var ns)
                    ? ns?.ToString() ?? "" : "";
                bool isBad = newStatus is "Critical" or "Failed";
                if (isBad && badStart == null) badStart = e.Timestamp;
                else if (!isBad && badStart != null)
                {
                    badSeconds += (e.Timestamp - badStart.Value).TotalSeconds;
                    badStart = null;
                }
            }
            if (badStart != null) badSeconds += (to - badStart.Value).TotalSeconds;
            double frac = 1.0 - Math.Clamp(badSeconds / span, 0, 1);
            totalFraction += frac;
        }
        return totalFraction / equipment.Count;
    }

    private (double MtbfHours, double MttrHours) ComputeMtbfMttr(DateTime from, DateTime to)
    {
        var events = _history.QueryEvents(null, from, to)
            .OrderBy(e => e.Timestamp)
            .ToList();

        var failures = events.Where(e => e.Type == EventType.Failure).ToList();
        var maint = events.Where(e => e.Type == EventType.MaintenancePerformed).ToList();

        // MTBF: среднее время между соседними отказами (в симулированных часах).
        double mtbfHours = 0;
        if (failures.Count >= 2)
        {
            double sum = 0;
            for (int i = 1; i < failures.Count; i++)
                sum += (failures[i].Timestamp - failures[i - 1].Timestamp).TotalHours;
            mtbfHours = sum / (failures.Count - 1);
        }
        else if (failures.Count == 1)
        {
            mtbfHours = (failures[0].Timestamp - from).TotalHours;
        }
        else
        {
            mtbfHours = (to - from).TotalHours; // отказов не было — оптимистично
        }

        // MTTR: среднее время от Failure до следующего Maintenance по тому же EquipmentId.
        double mttrHours = 0;
        int repaired = 0;
        foreach (var f in failures)
        {
            var nextMaint = maint
                .Where(m => m.EquipmentId == f.EquipmentId && m.Timestamp >= f.Timestamp)
                .OrderBy(m => m.Timestamp)
                .FirstOrDefault();
            if (nextMaint != null)
            {
                mttrHours += (nextMaint.Timestamp - f.Timestamp).TotalHours;
                repaired++;
            }
        }
        if (repaired > 0) mttrHours /= repaired;
        else mttrHours = 0;

        return (mtbfHours, mttrHours);
    }
}
