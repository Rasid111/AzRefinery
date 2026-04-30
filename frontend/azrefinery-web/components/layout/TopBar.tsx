"use client";

import { useEffect, useState } from "react";
import { plantHub } from "@/lib/signalr/connection";
import { usePlantStore } from "@/lib/store/plantStore";
import { TimeController } from "./TimeController";

export function TopBar() {
  const simState = usePlantStore((s) => s.simulationState);
  const simTime = usePlantStore((s) => s.simulationTime);
  const [connected, setConnected] = useState(false);
  const [realTimeLabel, setRealTimeLabel] = useState<string | null>(null);

  useEffect(() => {
    const updateConn = () => setConnected(plantHub.isConnected());
    const updateClock = () =>
      setRealTimeLabel(new Date().toLocaleTimeString("ru-RU"));
    updateConn();
    updateClock();
    const tConn = setInterval(updateConn, 500);
    const tClock = setInterval(updateClock, 1000);
    return () => {
      clearInterval(tConn);
      clearInterval(tClock);
    };
  }, []);

  const paused = simState?.isPaused ?? false;

  return (
    <header className="h-16 shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between gap-6">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`inline-block w-2 h-2 rounded-full shrink-0 ${
            connected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
          }`}
        />
        <span className="text-xs text-slate-400 shrink-0">
          {connected ? "Подключено" : "Нет соединения"}
        </span>

        <div className="ml-4 flex items-baseline gap-3 min-w-0">
          <span className="font-mono text-base text-slate-100 tabular-nums">
            {simTime ? new Date(simTime).toLocaleString("ru-RU") : "—"}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            симулир.
          </span>
          <span
            suppressHydrationWarning
            className="font-mono text-xs text-slate-500 tabular-nums hidden xl:inline"
          >
            {realTimeLabel ? `real: ${realTimeLabel}` : ""}
          </span>
        </div>

        {paused && (
          <span className="ml-3 text-amber-400 text-xs font-medium animate-pulse">
            ⏸ ПАУЗА
          </span>
        )}
      </div>

      <TimeController />
    </header>
  );
}
