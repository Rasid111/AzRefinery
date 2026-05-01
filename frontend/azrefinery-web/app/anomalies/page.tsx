"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnomalyCard } from "@/components/alerts/AnomalyCard";
import { useAnomalies } from "@/lib/signalr/hooks";
import { historyApi } from "@/lib/api/history";
import { equipmentApi } from "@/lib/api/equipment";
import type { AnomalyAlert, AnomalySeverity } from "@/lib/types/telemetry";
import type {
  AnomalyEventMetadata,
  EquipmentEventDto,
} from "@/lib/types/history";
import type { EquipmentDto } from "@/lib/types/equipment";

type Row = {
  id: string;
  timestamp: string;
  simulationTime?: string;
  equipmentId: string;
  sensorCode?: string;
  severity: AnomalySeverity;
  zScore?: number;
  currentValue?: number;
  expectedRange?: [number, number];
  message: string;
};

const SEVERITIES: AnomalySeverity[] = ["Critical", "Warning", "Info"];

function fromAlert(a: AnomalyAlert): Row {
  return {
    id: a.id,
    timestamp: a.timestamp,
    simulationTime: a.simulationTime,
    equipmentId: a.equipmentId,
    sensorCode: a.sensorCode,
    severity: a.severity,
    zScore: a.zScore,
    currentValue: a.currentValue,
    expectedRange: a.expectedRange,
    message: a.message,
  };
}

function fromEvent(e: EquipmentEventDto): Row | null {
  const m = (e.metadata ?? {}) as AnomalyEventMetadata;
  if (!m.severity) return null;
  return {
    id: e.id,
    timestamp: e.timestamp,
    equipmentId: e.equipmentId,
    sensorCode: m.sensorCode,
    severity: m.severity,
    zScore: m.zScore,
    currentValue: m.currentValue,
    expectedRange: m.expectedRange,
    message: e.message,
  };
}

export default function AnomaliesPage() {
  const live = useAnomalies(200);
  const [history, setHistory] = useState<EquipmentEventDto[]>([]);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [sevFilter, setSevFilter] = useState<AnomalySeverity | "All">("All");
  const [eqFilter, setEqFilter] = useState<string>("All");

  useEffect(() => {
    historyApi.anomalies().then(setHistory).catch(() => undefined);
    equipmentApi.list().then(setEquipment).catch(() => undefined);
    const t = setInterval(() => {
      historyApi.anomalies().then(setHistory).catch(() => undefined);
    }, 10_000);
    return () => clearInterval(t);
  }, []);

  const merged = useMemo<Row[]>(() => {
    const byId = new Map<string, Row>();
    for (const e of history) {
      const r = fromEvent(e);
      if (r) byId.set(r.id, r);
    }
    for (const a of live) byId.set(a.id, fromAlert(a));
    const all = Array.from(byId.values());
    all.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    return all;
  }, [history, live]);

  const filtered = useMemo(
    () =>
      merged.filter((r) => {
        if (sevFilter !== "All" && r.severity !== sevFilter) return false;
        if (eqFilter !== "All" && r.equipmentId !== eqFilter) return false;
        return true;
      }),
    [merged, sevFilter, eqFilter],
  );

  const counts = useMemo(() => {
    const c: Record<AnomalySeverity, number> = { Critical: 0, Warning: 0, Info: 0 };
    for (const r of merged) c[r.severity]++;
    return c;
  }, [merged]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Аномалии</h1>
        <div className="text-xs text-slate-400 font-mono">
          всего: {merged.length} · показано: {filtered.length}
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Серьёзность:</span>
          <FilterChip
            active={sevFilter === "All"}
            onClick={() => setSevFilter("All")}
            label={`Все (${merged.length})`}
          />
          {SEVERITIES.map((s) => (
            <FilterChip
              key={s}
              active={sevFilter === s}
              onClick={() => setSevFilter(s)}
              label={`${s} (${counts[s]})`}
              variant={s}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Объект:</span>
          <FilterChip
            active={eqFilter === "All"}
            onClick={() => setEqFilter("All")}
            label="Все"
          />
          {equipment.map((e) => (
            <FilterChip
              key={e.id}
              active={eqFilter === e.id}
              onClick={() => setEqFilter(e.id)}
              label={e.id}
            />
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">
          {merged.length === 0
            ? "Аномалий пока не зафиксировано. Запустите сценарий или используйте отладочный вброс через POST /api/equipment/{id}/debug/anomaly."
            : "Под выбранные фильтры ничего не подходит."}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <AnomalyCard
              key={r.id}
              id={r.id}
              timestamp={r.timestamp}
              simulationTime={r.simulationTime}
              equipmentId={r.equipmentId}
              sensorCode={r.sensorCode}
              severity={r.severity}
              zScore={r.zScore}
              currentValue={r.currentValue}
              expectedRange={r.expectedRange}
              message={r.message}
              href={`/equipment/${r.equipmentId}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  variant?: AnomalySeverity;
}) {
  const base = "h-7 px-3 text-xs rounded-full border transition";
  let activeCls = "bg-slate-100 text-slate-900 border-slate-100";
  if (variant === "Critical") activeCls = "bg-orange-500 text-slate-950 border-orange-500";
  else if (variant === "Warning") activeCls = "bg-amber-500 text-slate-950 border-amber-500";
  else if (variant === "Info") activeCls = "bg-cyan-500 text-slate-950 border-cyan-500";

  const inactive = "bg-transparent text-slate-300 border-slate-700 hover:border-slate-500";
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`${base} ${active ? activeCls : inactive}`}
    >
      {label}
    </Button>
  );
}
