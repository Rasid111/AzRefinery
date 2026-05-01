import { api } from "./client";
import type { TelemetryReadingDto, EquipmentEventDto } from "../types/history";
import type { AnomalySeverity } from "../types/telemetry";

function qs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const historyApi = {
  sensor: (
    sensorId: string,
    opts: { from?: string; to?: string; maxPoints?: number } = {},
  ) =>
    api<TelemetryReadingDto[]>(
      `/api/history/sensor/${encodeURIComponent(sensorId)}${qs(opts)}`,
    ),

  events: (
    equipmentId: string,
    opts: { from?: string; to?: string } = {},
  ) =>
    api<EquipmentEventDto[]>(
      `/api/history/equipment/${encodeURIComponent(equipmentId)}/events${qs(opts)}`,
    ),

  degradation: (
    equipmentId: string,
    opts: { from?: string; to?: string; maxPoints?: number } = {},
  ) =>
    api<TelemetryReadingDto[]>(
      `/api/history/equipment/${encodeURIComponent(equipmentId)}/degradation${qs(opts)}`,
    ),

  anomalies: (
    opts: {
      severity?: AnomalySeverity;
      equipmentId?: string;
      from?: string;
      to?: string;
    } = {},
  ) => api<EquipmentEventDto[]>(`/api/history/anomalies${qs(opts)}`),
};
