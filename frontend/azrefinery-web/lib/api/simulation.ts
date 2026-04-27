import { api } from "./client";
import type { SimulationState } from "../types/telemetry";

export const simulationApi = {
  getState: () => api<SimulationState>("/api/simulation/state"),
  setAcceleration: (value: number) =>
    api<SimulationState>("/api/simulation/acceleration", {
      method: "POST",
      body: JSON.stringify({ value }),
    }),
  pause: () => api<SimulationState>("/api/simulation/pause", { method: "POST" }),
  resume: () => api<SimulationState>("/api/simulation/resume", { method: "POST" }),
  reset: () => api<SimulationState>("/api/simulation/reset", { method: "POST" }),
};
