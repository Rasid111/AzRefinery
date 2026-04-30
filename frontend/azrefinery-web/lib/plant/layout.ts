import type { EquipmentType } from "@/lib/types/equipment";

export type DisplayAnchor = "top" | "bottom" | "center" | "left" | "right";

export interface PrimaryDisplay {
  sensor: string;
  unit: string;
  anchor: DisplayAnchor;
  /** Override default font-size (12 for the value, unit is 3px smaller). */
  fontSize?: number;
}

export interface PlantNode {
  id: string;
  name: string;
  type: EquipmentType;
  x: number;
  y: number;
  w: number;
  h: number;
  displays?: PrimaryDisplay[];
}

export interface PlantEdge {
  from: string;
  to: string;
  label?: string;
}

export const PLANT_VIEWBOX = { w: 920, h: 480 };

export const PLANT_NODES: PlantNode[] = [
  {
    id: "TANK-CRUDE-01",
    name: "Резервуар сырой нефти",
    type: "CrudeTank",
    x: 30,
    y: 180,
    w: 110,
    h: 130,
    displays: [{ sensor: "LEVEL", unit: "%", anchor: "center" }],
  },
  {
    id: "PUMP-01",
    name: "Насос подачи",
    type: "FeedPump",
    x: 193,
    y: 210,
    w: 80,
    h: 80,
    // No display: spinning impeller is the visual identity.
  },
  {
    id: "HEX-01",
    name: "Теплообменник",
    type: "HeatExchanger",
    x: 315,
    y: 200,
    w: 110,
    h: 100,
    // Inlet (cold) on the left, outlet (hot) on the right — mirrors the flow
    // direction PUMP → HEX → COL so the temperature jump is readable at a glance.
    displays: [
      { sensor: "INLET_TEMP_COLD", unit: "°C", anchor: "left", fontSize: 10 },
      { sensor: "OUTLET_TEMP_COLD", unit: "°C", anchor: "right", fontSize: 10 },
    ],
  },
  {
    id: "COL-01",
    name: "Ректификационная колонна",
    type: "DistillationColumn",
    x: 495,
    y: 90,
    w: 110,
    h: 320,
    // Top temp at the top of the column, bottom temp at the bottom — physical mapping.
    displays: [
      { sensor: "TOP_TEMP", unit: "°C", anchor: "top" },
      { sensor: "BOTTOM_TEMP", unit: "°C", anchor: "bottom" },
    ],
  },
  {
    id: "TANK-GASOLINE-01",
    name: "Бензин",
    type: "ProductTank",
    x: 700,
    y: 10,
    w: 100,
    h: 80,
    displays: [{ sensor: "LEVEL", unit: "%", anchor: "center" }],
  },
  {
    id: "TANK-KEROSENE-01",
    name: "Керосин",
    type: "ProductTank",
    x: 700,
    y: 130,
    w: 100,
    h: 80,
    displays: [{ sensor: "LEVEL", unit: "%", anchor: "center" }],
  },
  {
    id: "TANK-DIESEL-01",
    name: "Дизель",
    type: "ProductTank",
    x: 700,
    y: 250,
    w: 100,
    h: 80,
    displays: [{ sensor: "LEVEL", unit: "%", anchor: "center" }],
  },
  {
    id: "TANK-MAZUT-01",
    name: "Мазут",
    type: "ProductTank",
    x: 700,
    y: 370,
    w: 100,
    h: 80,
    displays: [{ sensor: "LEVEL", unit: "%", anchor: "center" }],
  },
];

export const PLANT_EDGES: PlantEdge[] = [
  { from: "TANK-CRUDE-01", to: "PUMP-01", label: "сырьё" },
  { from: "PUMP-01", to: "HEX-01" },
  { from: "HEX-01", to: "COL-01", label: "нагретое сырьё" },
  { from: "COL-01", to: "TANK-GASOLINE-01", label: "бензин" },
  { from: "COL-01", to: "TANK-KEROSENE-01", label: "керосин" },
  { from: "COL-01", to: "TANK-DIESEL-01", label: "дизель" },
  { from: "COL-01", to: "TANK-MAZUT-01", label: "мазут" },
];

export const NODE_BY_ID = new Map(PLANT_NODES.map((n) => [n.id, n]));
