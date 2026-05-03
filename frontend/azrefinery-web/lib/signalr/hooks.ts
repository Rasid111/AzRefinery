"use client";

import { useEffect, useState } from "react";
import { plantHub } from "./connection";
import type { TelemetryUpdate, SimulationState, AnomalyAlert } from "../types/telemetry";
import type { RulUpdate, KpiUpdate } from "../types/analytics";
import { usePlantStore } from "../store/plantStore";

export function useTelemetry(): TelemetryUpdate | null {
  const [last, setLast] = useState<TelemetryUpdate | null>(null);
  const updateAll = usePlantStore((s) => s.updateAll);

  useEffect(() => {
    const off = plantHub.on<TelemetryUpdate>("TelemetryUpdate", (payload) => {
      setLast(payload);
      updateAll(payload);
    });
    return off;
  }, [updateAll]);

  return last;
}

export function useSimulationState(): SimulationState | null {
  const [state, setState] = useState<SimulationState | null>(null);
  const setStore = usePlantStore((s) => s.setSimulationState);

  useEffect(() => {
    const off = plantHub.on<SimulationState>("SimulationStateChange", (payload) => {
      setState(payload);
      setStore(payload);
    });
    return off;
  }, [setStore]);

  return state;
}

export function useRulUpdates(): RulUpdate | null {
  const [last, setLast] = useState<RulUpdate | null>(null);
  useEffect(() => plantHub.on<RulUpdate>("RulUpdate", setLast), []);
  return last;
}

export function useKpiUpdates(): KpiUpdate | null {
  const [last, setLast] = useState<KpiUpdate | null>(null);
  useEffect(() => plantHub.on<KpiUpdate>("KpiUpdate", setLast), []);
  return last;
}

export function useAnomalies(maxCount = 100): AnomalyAlert[] {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  useEffect(() => {
    const off = plantHub.on<AnomalyAlert>("AnomalyAlert", (payload) => {
      setAlerts((prev) => [payload, ...prev].slice(0, maxCount));
    });
    return off;
  }, [maxCount]);
  return alerts;
}
