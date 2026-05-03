"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { KpiGauge } from "@/components/charts/KpiGauge";
import { useKpiUpdates } from "@/lib/signalr/hooks";
import { equipmentApi } from "@/lib/api/equipment";
import type { EquipmentDto } from "@/lib/types/equipment";
import type { PlantKpis } from "@/lib/types/analytics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface TrendPoint {
  t: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

const MAX_TREND = 120;

export default function KpiPage() {
  const kpi = useKpiUpdates();
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const lastTs = useRef<string | null>(null);

  useEffect(() => {
    equipmentApi.list().then(setEquipment).catch(() => undefined);
    const t = setInterval(() => {
      equipmentApi.list().then(setEquipment).catch(() => undefined);
    }, 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!kpi || kpi.timestamp === lastTs.current) return;
    lastTs.current = kpi.timestamp;
    setTrend((prev) => {
      const next = [
        ...prev,
        {
          t: new Date(kpi.timestamp).toLocaleTimeString("ru-RU"),
          oee: kpi.plant.oee,
          availability: kpi.plant.availability,
          performance: kpi.plant.performance,
          quality: kpi.plant.quality,
        },
      ];
      return next.slice(-MAX_TREND);
    });
  }, [kpi]);

  const eqMap = useMemo(() => {
    const m = new Map<string, EquipmentDto>();
    for (const e of equipment) m.set(e.id, e);
    return m;
  }, [equipment]);

  if (!kpi) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">KPI</h1>
        <Card className="p-8 text-center text-sm text-slate-400">
          Ожидание первого обновления KPI… (приходят раз в 5 секунд)
        </Card>
      </div>
    );
  }

  const p: PlantKpis = kpi.plant;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">KPI завода</h1>
        <div className="text-xs text-slate-400 font-mono">
          обновлено {new Date(kpi.timestamp).toLocaleTimeString("ru-RU")}
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <KpiGauge label="OEE" value={p.oee} />
          <KpiGauge label="Availability" value={p.availability} />
          <KpiGauge label="Performance" value={p.performance} />
          <KpiGauge label="Quality" value={p.quality} />
        </div>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <MetricCard label="Throughput" value={`${p.throughput.toFixed(1)}`} unit="m³/h" />
        <MetricCard label="MTBF" value={p.mtbfHours.toFixed(1)} unit="ч (симул.)" />
        <MetricCard label="MTTR" value={p.mttrHours.toFixed(2)} unit="ч (симул.)" />
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Тренды KPI</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="oee" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
              <Area type="monotone" dataKey="availability" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              <Area type="monotone" dataKey="performance" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
              <Area type="monotone" dataKey="quality" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 text-xs mt-2">
          <Legend color="#22d3ee" label="OEE" />
          <Legend color="#10b981" label="Availability" />
          <Legend color="#f59e0b" label="Performance" />
          <Legend color="#a78bfa" label="Quality" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">KPI по объектам</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-800">
                <th className="text-left py-2 font-normal">Объект</th>
                <th className="text-right py-2 font-normal">Health</th>
                <th className="text-right py-2 font-normal">Availability</th>
                <th className="text-right py-2 font-normal">OEE</th>
                <th className="text-left py-2 pl-3 font-normal">Статус</th>
              </tr>
            </thead>
            <tbody>
              {kpi.equipment.map((e) => {
                const meta = eqMap.get(e.equipmentId);
                return (
                  <tr key={e.equipmentId} className="border-b border-slate-900">
                    <td className="py-2">
                      <div className="font-medium">{meta?.name ?? e.equipmentId}</div>
                      <div className="text-xs text-slate-500 font-mono">{e.equipmentId}</div>
                    </td>
                    <td className="text-right font-mono">{e.healthIndex.toFixed(0)}%</td>
                    <td className="text-right font-mono">{e.availability.toFixed(0)}%</td>
                    <td className="text-right font-mono">{e.oee.toFixed(0)}%</td>
                    <td className="pl-3">
                      <span className={statusClass(meta?.status)}>{meta?.status ?? "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-3xl font-mono font-semibold text-slate-100">{value}</div>
        <div className="text-xs text-slate-500">{unit}</div>
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

function statusClass(s?: string): string {
  switch (s) {
    case "Running": return "text-emerald-400";
    case "Warning": return "text-amber-400";
    case "Critical": return "text-orange-400";
    case "Failed": return "text-red-400";
    case "Stopped": return "text-slate-500";
    default: return "text-slate-500";
  }
}
