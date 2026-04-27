export type EquipmentType =
  | "CrudeTank"
  | "FeedPump"
  | "HeatExchanger"
  | "DistillationColumn"
  | "ProductTank";

export type EquipmentStatus =
  | "Running"
  | "Warning"
  | "Critical"
  | "Stopped"
  | "Failed";

export type SensorType =
  | "Temperature"
  | "Pressure"
  | "FlowRate"
  | "Level"
  | "Vibration"
  | "Power";

export interface SensorDto {
  id: string;
  code: string;
  type: SensorType;
  unit: string;
  currentValue: number;
  nominalValue: number;
  minValue: number;
  maxValue: number;
}

export interface EquipmentDto {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  healthIndex: number;
  degradationLevel: number;
  commissionedAt: string;
  setpoints: Record<string, number>;
  readings: Record<string, number>;
  sensors: SensorDto[];
}
