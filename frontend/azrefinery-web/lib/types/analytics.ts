export interface RulEstimateDto {
  equipmentId: string;
  isAvailable: boolean;
  remainingHoursSimulated: number;
  confidence: number;
  predictedFailureTime: string;
  recommendedMaintenanceTime: string;
  recommendedAction: string;
}

export interface RulUpdate {
  timestamp: string;
  estimates: RulEstimateDto[];
}

export interface PlantKpis {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  throughput: number;
  mtbfHours: number;
  mttrHours: number;
  calculatedAt: string;
}

export interface EquipmentKpis {
  equipmentId: string;
  oee: number;
  availability: number;
  healthIndex: number;
}

export interface KpiUpdate {
  timestamp: string;
  plant: PlantKpis;
  equipment: EquipmentKpis[];
}

export interface ScenarioDto {
  name: string;
  displayName: string;
  description: string;
  targetEquipmentId: string;
  isActive: boolean;
}
