"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { simulationApi } from "@/lib/api/simulation";
import { usePlantStore } from "@/lib/store/plantStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PRESETS = [1, 10, 60, 300, 1000];
const LOG_MIN = Math.log10(0.1);
const LOG_MAX = Math.log10(10000);

function accelToSlider(value: number): number {
  const clamped = Math.max(0.1, Math.min(10000, value));
  return ((Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000;
}

function sliderToAccel(slider: number): number {
  const log = LOG_MIN + (slider / 1000) * (LOG_MAX - LOG_MIN);
  const raw = Math.pow(10, log);
  if (raw < 1) return Math.round(raw * 10) / 10;
  if (raw < 10) return Math.round(raw);
  if (raw < 100) return Math.round(raw / 5) * 5;
  if (raw < 1000) return Math.round(raw / 10) * 10;
  return Math.round(raw / 100) * 100;
}

export function TimeController() {
  const simState = usePlantStore((s) => s.simulationState);
  const setSimulationState = usePlantStore((s) => s.setSimulationState);
  const [pending, startTransition] = useTransition();
  const [draftAccel, setDraftAccel] = useState<number | null>(null);

  const accel = simState?.timeAcceleration ?? 60;
  const paused = simState?.isPaused ?? false;
  const sliderValue = draftAccel !== null ? accelToSlider(draftAccel) : accelToSlider(accel);

  const apply = (action: () => Promise<typeof simState>) => {
    startTransition(async () => {
      try {
        const next = await action();
        if (next) setSimulationState(next);
      } catch (e) {
        console.error(e);
      }
    });
  };

  const setAcceleration = (value: number) =>
    apply(() => simulationApi.setAcceleration(value));

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 p-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAcceleration(p)}
            disabled={pending}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded transition-colors",
              accel === p
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent",
              pending && "opacity-50 cursor-not-allowed",
            )}
          >
            {p}×
          </button>
        ))}
      </div>

      <div className="w-32 flex items-center gap-2">
        <Slider
          value={[sliderValue]}
          min={0}
          max={1000}
          onValueChange={(v) => setDraftAccel(sliderToAccel(Array.isArray(v) ? v[0] : v))}
          onValueCommitted={(v) => {
            const target = sliderToAccel(Array.isArray(v) ? v[0] : v);
            setDraftAccel(null);
            setAcceleration(target);
          }}
        />
        <span className="font-mono text-xs text-slate-300 w-14 text-right tabular-nums">
          {(draftAccel ?? accel).toString()}×
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => apply(paused ? simulationApi.resume : simulationApi.pause)}
          disabled={pending}
          className={cn(
            "size-8 inline-flex items-center justify-center rounded-md border transition-colors",
            paused
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800",
            pending && "opacity-50",
          )}
          aria-label={paused ? "Возобновить" : "Пауза"}
          title={paused ? "Возобновить" : "Пауза"}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm("Сбросить симуляцию к начальному состоянию?")) return;
            apply(simulationApi.reset);
          }}
          disabled={pending}
          className="size-8 inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Сброс"
          title="Сброс"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </div>
  );
}
