using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Domain.Equipment;

public class DistillationColumn : Equipment
{
    public HeatExchanger UpstreamHex { get; init; } = null!;

    /// <summary>Доли отбора фракций. Сумма = 1.0.</summary>
    public static readonly (string Code, double Fraction)[] CutFractions =
    {
        ("GASOLINE_DRAW", 0.30),
        ("KEROSENE_DRAW", 0.25),
        ("DIESEL_DRAW",   0.25),
        ("MAZUT_DRAW",    0.20),
    };

    public override void Tick(SimulationContext ctx)
    {
        var topS = GetSensor("TOP_TEMP");
        var botS = GetSensor("BOTTOM_TEMP");
        var pressS = GetSensor("PRESSURE");
        var levelS = GetSensor("LEVEL");
        var refluxS = GetSensor("REFLUX_FLOW");
        var gasS = GetSensor("GASOLINE_DRAW");
        var kerS = GetSensor("KEROSENE_DRAW");
        var dieS = GetSensor("DIESEL_DRAW");
        var mazS = GetSensor("MAZUT_DRAW");

        double feedFlow = UpstreamHex.GetSensor("FLOW_RATE").CurrentValue;
        double feedTemp = UpstreamHex.GetSensor("OUTLET_TEMP_COLD").CurrentValue;

        if (Status == EquipmentStatus.Stopped || Status == EquipmentStatus.Failed || feedFlow < 1e-3)
        {
            foreach (var s in new[] { topS, botS, refluxS, gasS, kerS, dieS, mazS })
                s.CurrentValue = 0;
            pressS.CurrentValue = 1.0;
            StepDegradation(ctx.Dt);
            return;
        }

        // Уставка орошения; сценарий ColumnRefluxLoss перетягивает её вниз.
        double targetReflux = Setpoints.GetValueOrDefault("REFLUX_FLOW", 60.0);
        // Плавный выход на уставку.
        refluxS.CurrentValue += (targetReflux - refluxS.CurrentValue) * Math.Min(1.0, ctx.Dt / 5.0);

        // Низ колонны определяется температурой подачи + догрев.
        botS.CurrentValue = (feedTemp + 120.0) * (1.0 + ctx.Noise());

        // Корреляция из CLAUDE.md, раздел 1.3 (база 145 вместо 130 — компенсация номинала
        // REFLUX_FLOW=60: при подстановке 145 + (50-60)*1.5 = 130 — спецификация TOP_TEMP).
        double topTemp = 145.0
                        + (50.0 - refluxS.CurrentValue) * 1.5
                        + (350.0 - botS.CurrentValue) * 0.3;
        topS.CurrentValue = topTemp * (1.0 + ctx.Noise());

        pressS.CurrentValue = 1.3 * (1.0 + ctx.Noise());
        levelS.CurrentValue = 50.0 + 50.0 * ctx.Noise();

        // Распределение боковых отборов: сумма = расход подачи.
        gasS.CurrentValue = feedFlow * 0.30 * (1.0 + ctx.Noise());
        kerS.CurrentValue = feedFlow * 0.25 * (1.0 + ctx.Noise());
        dieS.CurrentValue = feedFlow * 0.25 * (1.0 + ctx.Noise());
        mazS.CurrentValue = feedFlow * 0.20 * (1.0 + ctx.Noise());

        StepDegradation(ctx.Dt);
    }
}
