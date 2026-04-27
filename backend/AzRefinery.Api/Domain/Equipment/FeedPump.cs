using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Domain.Equipment;

public class FeedPump : Equipment
{
    public CrudeTank UpstreamTank { get; init; } = null!;
    /// <summary>Падение давления всасывания (bar) — устанавливается сценарием PumpFilterClog.</summary>
    public double SuctionPressureDrop { get; set; } = 0.0;

    public override void Tick(SimulationContext ctx)
    {
        var flowS = GetSensor("FLOW_RATE");
        var pressS = GetSensor("OUTLET_PRESSURE");
        var bearingS = GetSensor("BEARING_TEMP");
        var vibS = GetSensor("VIBRATION");
        var powerS = GetSensor("POWER");

        double targetFlow = Setpoints.GetValueOrDefault("TARGET_FLOW", 150.0);
        double tankLevel = UpstreamTank.GetSensor("LEVEL").CurrentValue;
        bool tankEmpty = tankLevel < 5.0;

        if (Status == EquipmentStatus.Stopped || Status == EquipmentStatus.Failed || tankEmpty)
        {
            flowS.CurrentValue = 0;
            powerS.CurrentValue = 0;
            pressS.CurrentValue = 0;
            vibS.CurrentValue = 0;
            bearingS.CurrentValue = 25.0 + 25.0 * ctx.Noise();
            UpstreamTank.OutflowRateM3H = 0;
            StepDegradation(ctx.Dt);
            return;
        }

        double D = DegradationLevel;

        // Расход: эффективность падает с деградацией и засорением фильтра.
        double effectiveTarget = targetFlow * (1.0 - 0.3 * D * D) - SuctionPressureDrop * 8.0;
        flowS.CurrentValue = Math.Max(0, effectiveTarget * (1.0 + ctx.Noise()));

        // Сообщить танку, сколько мы тянем.
        UpstreamTank.OutflowRateM3H = flowS.CurrentValue;

        // Мощность пропорциональна расходу + потери на трение от деградации.
        double loadFraction = flowS.CurrentValue / 150.0;
        powerS.CurrentValue = 75.0 * loadFraction * (1.0 + 0.2 * D) * (1.0 + ctx.Noise());

        // Вибрация: база + квадратичный рост от деградации; сверху "высокочастотная" компонента при D>0.7.
        double baseVib = 1.5 + 5.0 * D * D;
        double hf = D > 0.7 ? (D - 0.7) * 6.0 * Math.Abs(ctx.Noise(0.5)) : 0;
        vibS.CurrentValue = Math.Max(0, baseVib + hf + baseVib * ctx.Noise());

        // Температура подшипника по корреляции из CLAUDE.md, раздел 1.3.
        bearingS.CurrentValue = 60.0 + 5.0 * vibS.CurrentValue + 0.1 * powerS.CurrentValue
                              + 60.0 * ctx.Noise();

        // Давление на выходе: номинал 5 bar, страдает от деградации и засорения.
        double pressure = 5.0 * (1.0 - 0.1 * D) - SuctionPressureDrop;
        pressS.CurrentValue = Math.Max(0, pressure * (1.0 + ctx.Noise()));

        StepDegradation(ctx.Dt);
    }
}
