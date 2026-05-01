import type { AnomalySeverity } from "./telemetry";

export interface TelemetryReadingDto {
  timestamp: string;
  value: number;
}

export type EventType =
  | "StatusChange"
  | "AnomalyDetected"
  | "SetpointChanged"
  | "MaintenancePerformed"
  | "ScenarioTriggered"
  | "Failure";

export interface EquipmentEventDto {
  id: string;
  equipmentId: string;
  type: EventType;
  timestamp: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

export interface EquipmentStateChange {
  timestamp: string;
  simulationTime: string;
  equipmentId: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
}

export interface AnomalyEventMetadata {
  sensorId?: string;
  sensorCode?: string;
  severity?: AnomalySeverity;
  zScore?: number;
  currentValue?: number;
  expectedRange?: [number, number];
}
