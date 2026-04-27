"use client";

import { useEffect } from "react";
import { plantHub } from "@/lib/signalr/connection";
import { simulationApi } from "@/lib/api/simulation";
import { usePlantStore } from "@/lib/store/plantStore";
import { useTelemetry, useSimulationState } from "@/lib/signalr/hooks";

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  // Активируют подписки на хабе и зеркалят данные в Zustand-store.
  useTelemetry();
  useSimulationState();
  const setSimulationState = usePlantStore((s) => s.setSimulationState);

  useEffect(() => {
    plantHub.start().catch(() => {});
    simulationApi
      .getState()
      .then(setSimulationState)
      .catch((err) => console.error("Failed to load initial sim state:", err));
  }, [setSimulationState]);

  return <>{children}</>;
}
