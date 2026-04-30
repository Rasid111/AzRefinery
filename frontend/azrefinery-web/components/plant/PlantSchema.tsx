"use client";

import { useState } from "react";
import { usePlantStore } from "@/lib/store/plantStore";
import {
  NODE_BY_ID,
  PLANT_EDGES,
  PLANT_NODES,
  PLANT_VIEWBOX,
} from "@/lib/plant/layout";
import { EquipmentNode } from "./EquipmentNode";
import { FlowLine } from "./FlowLine";
import { NodeTooltip } from "./NodeTooltip";

export function PlantSchema() {
  const equipment = usePlantStore((s) => s.equipment);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredNode = hoveredId ? NODE_BY_ID.get(hoveredId) : undefined;
  const hoveredSnap = hoveredId ? equipment.get(hoveredId) : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Технологическая схема
          </h2>
          <p className="text-xs text-slate-500">
            Наведите на узел для деталей · клик — детальная страница
          </p>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${PLANT_VIEWBOX.w} ${PLANT_VIEWBOX.h}`}
        className="block mx-auto w-full h-auto"
        style={{ maxHeight: "calc(100vh - 180px)" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {PLANT_EDGES.map((edge) => {
          const from = NODE_BY_ID.get(edge.from);
          const to = NODE_BY_ID.get(edge.to);
          if (!from || !to) return null;
          const fromSnap = equipment.get(edge.from);
          const toSnap = equipment.get(edge.to);
          const active =
            (fromSnap?.status === "Running" ||
              fromSnap?.status === "Warning") &&
            toSnap?.status !== "Failed";
          return (
            <FlowLine
              key={`${edge.from}->${edge.to}`}
              edge={edge}
              from={from}
              to={to}
              active={Boolean(active)}
            />
          );
        })}

        {PLANT_NODES.map((node) => (
          <EquipmentNode
            key={node.id}
            node={node}
            snapshot={equipment.get(node.id)}
            onHoverChange={setHoveredId}
            hovered={hoveredId === node.id}
          />
        ))}

        {hoveredNode && (
          <NodeTooltip node={hoveredNode} snapshot={hoveredSnap} />
        )}
      </svg>
    </div>
  );
}
