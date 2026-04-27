import { api } from "./client";
import type { EquipmentDto, SensorDto } from "../types/equipment";

export const equipmentApi = {
  list: () => api<EquipmentDto[]>("/api/equipment"),
  get: (id: string) => api<EquipmentDto>(`/api/equipment/${id}`),
  sensors: (id: string) => api<SensorDto[]>(`/api/equipment/${id}/sensors`),
  setSetpoint: (id: string, name: string, value: number) =>
    api<void>(`/api/equipment/${id}/setpoints`, {
      method: "POST",
      body: JSON.stringify({ name, value }),
    }),
  start: (id: string) => api<void>(`/api/equipment/${id}/start`, { method: "POST" }),
  stop: (id: string) => api<void>(`/api/equipment/${id}/stop`, { method: "POST" }),
  maintenance: (id: string) =>
    api<void>(`/api/equipment/${id}/maintenance`, { method: "POST" }),
};
