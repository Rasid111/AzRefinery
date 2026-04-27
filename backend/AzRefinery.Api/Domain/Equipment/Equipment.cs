using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Domain.Sensors;
using AzRefinery.Api.Simulation;
using AzRefinery.Api.Simulation.DegradationModels;

namespace AzRefinery.Api.Domain.Equipment;

public abstract class Equipment
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public EquipmentType Type { get; init; }
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Running;
    public double HealthIndex { get; set; } = 100.0;
    public double DegradationLevel { get; set; }
    public DateTime CommissionedAt { get; init; } = DateTime.UtcNow;
    public Dictionary<string, double> Setpoints { get; set; } = new();
    public List<Sensor> Sensors { get; init; } = new();

    public double DegradationRateMultiplier { get; set; } = 1.0;
    public IDegradationModel DegradationModel { get; init; } = new LinearDegradation();

    public abstract void Tick(SimulationContext ctx);

    public virtual Dictionary<string, double> GetCurrentReadings()
        => Sensors.ToDictionary(s => s.Code, s => s.CurrentValue);

    public Sensor GetSensor(string code) => Sensors.First(s => s.Code == code);

    /// <summary>Подъём деградации согласно модели; обновляет HealthIndex.</summary>
    protected void StepDegradation(double dtSeconds)
    {
        if (Status == EquipmentStatus.Stopped || Status == EquipmentStatus.Failed)
            return;
        DegradationLevel = DegradationModel.Step(DegradationLevel, dtSeconds, DegradationRateMultiplier);
        HealthIndex = Math.Round((1.0 - DegradationLevel) * 100.0, 2);
        if (DegradationLevel >= 1.0 && Status != EquipmentStatus.Failed)
        {
            Status = EquipmentStatus.Failed;
        }
    }

    /// <summary>Полное обслуживание — сброс деградации.</summary>
    public virtual void PerformMaintenance()
    {
        DegradationLevel = 0.0;
        HealthIndex = 100.0;
        if (Status == EquipmentStatus.Failed || Status == EquipmentStatus.Critical || Status == EquipmentStatus.Warning)
        {
            Status = EquipmentStatus.Running;
        }
    }
}
