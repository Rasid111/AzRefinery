import type { EquipmentStatus } from "./equipment";

export interface EquipmentSnapshot {
  id: string;
  status: EquipmentStatus;
  healthIndex: number;
  degradationLevel: number;
  sensors: Record<string, number>;
}

export interface TelemetryUpdate {
  timestamp: string;
  simulationTime: string;
  equipment: EquipmentSnapshot[];
}

export interface SimulationState {
  simulationTime: string;
  realTime: string;
  realStartTime: string;
  timeAcceleration: number;
  isPaused: boolean;
}

export type AnomalySeverity = "Info" | "Warning" | "Critical";

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  simulationTime: string;
  equipmentId: string;
  sensorId: string;
  severity: AnomalySeverity;
  zScore: number;
  currentValue: number;
  expectedRange: [number, number];
  message: string;
}
