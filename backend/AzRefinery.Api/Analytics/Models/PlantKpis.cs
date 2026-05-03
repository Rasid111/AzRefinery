namespace AzRefinery.Api.Analytics.Models;

public record PlantKpis(
    double Oee,
    double Availability,
    double Performance,
    double Quality,
    double Throughput,
    double MtbfHours,
    double MttrHours,
    DateTime CalculatedAt);

public record EquipmentKpis(
    string EquipmentId,
    double Oee,
    double Availability,
    double HealthIndex);
