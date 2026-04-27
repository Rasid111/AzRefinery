"use client";

import { create } from "zustand";
import type { TelemetryUpdate, EquipmentSnapshot, SimulationState } from "../types/telemetry";

interface PlantStore {
  equipment: Map<string, EquipmentSnapshot>;
  lastUpdate: Date | null;
  simulationTime: string | null;
  simulationState: SimulationState | null;

  updateAll: (update: TelemetryUpdate) => void;
  setSimulationState: (state: SimulationState) => void;
}

export const usePlantStore = create<PlantStore>((set) => ({
  equipment: new Map(),
  lastUpdate: null,
  simulationTime: null,
  simulationState: null,

  updateAll: (update) => {
    const next = new Map<string, EquipmentSnapshot>();
    for (const e of update.equipment) next.set(e.id, e);
    set({
      equipment: next,
      lastUpdate: new Date(update.timestamp),
      simulationTime: update.simulationTime,
    });
  },

  setSimulationState: (state) => set({ simulationState: state }),
}));
