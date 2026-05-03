import { api } from "./client";
import type { ScenarioDto } from "../types/analytics";

export const scenariosApi = {
  list: () => api<ScenarioDto[]>("/api/scenarios"),
  active: () => api<ScenarioDto[]>("/api/scenarios/active"),
  trigger: (name: string) =>
    api<ScenarioDto>(`/api/scenarios/${encodeURIComponent(name)}/trigger`, { method: "POST" }),
  cancel: (name: string) =>
    api<void>(`/api/scenarios/${encodeURIComponent(name)}/cancel`, { method: "POST" }),
  reset: () => api<void>("/api/scenarios/reset", { method: "POST" }),
};
