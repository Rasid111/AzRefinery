using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Simulation;

namespace AzRefinery.Api.Domain.Equipment;

public class HeatExchanger : Equipment
{
    public FeedPump UpstreamPump { get; init; } = null!;

    /// <summary>Текущая эффективность теплообмена (производный показатель, не датчик).</summary>
    public double Efficiency { get; private set; } = 0.85;

    public override void Tick(SimulationContext ctx)
    {
        var inColdS = GetSensor("INLET_TEMP_COLD");
        var outColdS = GetSensor("OUTLET_TEMP_COLD");
        var inHotS = GetSensor("INLET_TEMP_HOT");
        var outHotS = GetSensor("OUTLET_TEMP_HOT");
        var flowS = GetSensor("FLOW_RATE");

        double D = DegradationLevel;
        // База 0.65 (а не 0.85 как в CLAUDE.md) — чтобы выходная температура попадала
        // в нормальный диапазон 220-240°C. См. примечание в ROADMAP, журнал решений.
        Efficiency = 0.65 * (1.0 - D * 0.5);

        double tankTemp = UpstreamPump.UpstreamTank.GetSensor("TEMPERATURE").CurrentValue;
        double pumpFlow = UpstreamPump.GetSensor("FLOW_RATE").CurrentValue;

        inColdS.CurrentValue = tankTemp * (1.0 + ctx.Noise());
        inHotS.CurrentValue = 340.0 * (1.0 + ctx.Noise());
        flowS.CurrentValue = pumpFlow;

        if (pumpFlow < 1e-3)
        {
            // Нет подачи — теплообмен не идёт, выходные температуры стремятся к входным.
            outColdS.CurrentValue = inColdS.CurrentValue;
            outHotS.CurrentValue = inHotS.CurrentValue;
        }
        else
        {
            double dT = inHotS.CurrentValue - inColdS.CurrentValue;
            outColdS.CurrentValue = (inColdS.CurrentValue + dT * Efficiency) * (1.0 + ctx.Noise());
            outHotS.CurrentValue = (inHotS.CurrentValue - dT * Efficiency * 0.6) * (1.0 + ctx.Noise());
        }

        StepDegradation(ctx.Dt);
    }
}
