import type { PlantNode } from "@/lib/plant/layout";
import type { EquipmentStatus } from "@/lib/types/equipment";

export interface ShapeProps {
  node: PlantNode;
  status: EquipmentStatus;
  color: string;
  /** 0..100 — для резервуаров, доля заполнения. Для остальных игнорируется. */
  fill?: number;
}

export const SHAPE_BASE_FILL = "#0f172a";
