"use client";

import Link from "next/link";
import type { AnomalySeverity } from "@/lib/types/telemetry";

interface Props {
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
  href?: string;
}

const SEV_BG: Record<AnomalySeverity, string> = {
  Info: "bg-cyan-500/10 border-cyan-500/30",
  Warning: "bg-amber-500/10 border-amber-500/30",
  Critical: "bg-orange-500/10 border-orange-500/40",
};

const SEV_DOT: Record<AnomalySeverity, string> = {
  Info: "bg-cyan-400",
  Warning: "bg-amber-400",
  Critical: "bg-orange-500 animate-pulse",
};

const SEV_LABEL: Record<AnomalySeverity, string> = {
  Info: "Инфо",
  Warning: "Предупреждение",
  Critical: "Критично",
};

const fmt = (iso: string) => new Date(iso).toLocaleString("ru-RU", { hour12: false });

export function AnomalyCard({
  timestamp,
  simulationTime,
  equipmentId,
  sensorCode,
  severity,
  zScore,
  currentValue,
  expectedRange,
  message,
  href,
}: Props) {
  const inner = (
    <div className={`rounded-md border ${SEV_BG[severity]} p-3 transition hover:border-slate-500`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full ${SEV_DOT[severity]}`} />
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {SEV_LABEL[severity]}
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="font-mono text-xs text-slate-300 truncate">
            {equipmentId}
            {sensorCode ? ` / ${sensorCode}` : ""}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {fmt(timestamp)}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-200">{message}</p>
      {(currentValue !== undefined || zScore !== undefined) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
          {currentValue !== undefined && (
            <span>
              значение: <span className="text-slate-200">{currentValue.toFixed(2)}</span>
            </span>
          )}
          {expectedRange && (
            <span>
              норма:{" "}
              <span className="text-slate-200">
                [{expectedRange[0].toFixed(2)}; {expectedRange[1].toFixed(2)}]
              </span>
            </span>
          )}
          {zScore !== undefined && (
            <span>
              Z: <span className="text-slate-200">{zScore.toFixed(2)}σ</span>
            </span>
          )}
          {simulationTime && (
            <span>
              sim: <span className="text-slate-200">{fmt(simulationTime)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
