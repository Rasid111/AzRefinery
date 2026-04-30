import type { EquipmentType } from "@/lib/types/equipment";
import { ColumnShape } from "./ColumnShape";
import { HeatExchangerShape } from "./HeatExchangerShape";
import { PumpShape } from "./PumpShape";
import { TankShape } from "./TankShape";
import type { ShapeProps } from "./types";

const REGISTRY: Record<EquipmentType, (props: ShapeProps) => React.JSX.Element> = {
  CrudeTank: TankShape,
  ProductTank: TankShape,
  FeedPump: PumpShape,
  HeatExchanger: HeatExchangerShape,
  DistillationColumn: ColumnShape,
};

export function EquipmentShape(props: ShapeProps) {
  const Component = REGISTRY[props.node.type];
  return <Component {...props} />;
}

export type { ShapeProps } from "./types";
