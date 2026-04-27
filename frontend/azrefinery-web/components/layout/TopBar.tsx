"use client";

import { usePlantStore } from "@/lib/store/plantStore";
import { useEffect, useState } from "react";
import { plantHub } from "@/lib/signalr/connection";

export function TopBar() {
  const simState = usePlantStore((s) => s.simulationState);
  const simTime = usePlantStore((s) => s.simulationTime);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setConnected(plantHub.isConnected()), 500);
    return () => clearInterval(t);
  }, []);

  const accel = simState?.timeAcceleration ?? 60;
  const paused = simState?.isPaused ?? false;

  return (
    <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
          }`}
        />
        <span className="text-xs text-slate-400">
          {connected ? "Подключено" : "Нет соединения"}
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="font-mono text-slate-100">
            {simTime ? new Date(simTime).toLocaleString("ru-RU") : "—"}
          </span>
          <span className="text-xs text-slate-500">симулированное время</span>
        </div>
        <div className="text-slate-300">
          <span className="font-mono">{accel}×</span>
          {paused && <span className="ml-2 text-amber-500">⏸ Пауза</span>}
        </div>
      </div>
    </header>
  );
}
