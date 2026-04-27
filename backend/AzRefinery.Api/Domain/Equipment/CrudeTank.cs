using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Domain.Equipment;

public class CrudeTank : Equipment
{
    public double VolumeM3 { get; init; } = 5000.0;
    /// <summary>Расход на выходе (m³/h), задаётся подключённым насосом.</summary>
    public double OutflowRateM3H { get; set; } = 0.0;
    /// <summary>Утечка (m³/h), включается сценарием CrudeTankLeak.</summary>
    public double LeakRateM3H { get; set; } = 0.0;

    public override void Tick(SimulationContext ctx)
    {
        var levelSensor = GetSensor("LEVEL");
        var tempSensor = GetSensor("TEMPERATURE");

        double dtHours = ctx.Dt / 3600.0;

        if (Status == EquipmentStatus.Stopped || Status == EquipmentStatus.Failed)
        {
            OutflowRateM3H = 0;
        }

        // Автоматическое пополнение поддерживает уровень около уставки (имитация центрального снабжения).
        double targetLevel = Setpoints.GetValueOrDefault("TARGET_LEVEL", 80.0);
        double levelError = targetLevel - levelSensor.CurrentValue;
        double inflow = Math.Max(0, OutflowRateM3H + LeakRateM3H + levelError * 5.0);

        // dLevel% = (inflow - outflow - leak) / volume * 100 * dt_h
        double dLevel = (inflow - OutflowRateM3H - LeakRateM3H) / VolumeM3 * 100.0 * dtHours;
        levelSensor.CurrentValue = Math.Clamp(levelSensor.CurrentValue + dLevel, 0, 100);

        // Температура близка к окружающей.
        double targetTemp = 25.0;
        tempSensor.CurrentValue = targetTemp + targetTemp * ctx.Noise();

        StepDegradation(ctx.Dt);
    }
}
