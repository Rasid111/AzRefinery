"use client";

import { useTelemetry } from "@/lib/signalr/hooks";
import { usePlantStore } from "@/lib/store/plantStore";

export default function DashboardPage() {
  useTelemetry();
  const equipmentMap = usePlantStore((s) => s.equipment);
  const lastUpdate = usePlantStore((s) => s.lastUpdate);
  const equipment = Array.from(equipmentMap.values());

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="text-sm text-slate-400">
          Поток телеметрии (каркас — мнемосхема в этапе 6)
        </p>
        {lastUpdate && (
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Последнее обновление: {lastUpdate.toLocaleTimeString("ru-RU")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
        {equipment.length === 0 && (
          <div className="col-span-full text-slate-500 text-sm">
            Ожидание подключения к SignalR…
          </div>
        )}
        {equipment.map((eq) => (
          <div
            key={eq.id}
            className="rounded-md border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-slate-400">{eq.id}</span>
              <StatusBadge status={eq.status} />
            </div>
            <div className="text-xs text-slate-400 mb-2">
              Health:{" "}
              <span className="font-mono text-slate-200">
                {eq.healthIndex.toFixed(1)}
              </span>{" "}
              · Degr:{" "}
              <span className="font-mono text-slate-200">
                {(eq.degradationLevel * 100).toFixed(2)}%
              </span>
            </div>
            <div className="space-y-0.5 text-xs font-mono">
              {Object.entries(eq.sensors).map(([code, value]) => (
                <div key={code} className="flex justify-between">
                  <span className="text-slate-500">{code}</span>
                  <span className="text-slate-200">{value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Running"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : status === "Warning"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
      : status === "Critical"
      ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
      : status === "Failed"
      ? "bg-red-500/20 text-red-400 border-red-500/40"
      : "bg-slate-700/40 text-slate-400 border-slate-600";
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${color}`}>
      {status}
    </span>
  );
}
