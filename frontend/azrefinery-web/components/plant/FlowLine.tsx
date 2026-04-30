"use client";

import type { PlantEdge, PlantNode } from "@/lib/plant/layout";

interface FlowLineProps {
  edge: PlantEdge;
  from: PlantNode;
  to: PlantNode;
  active: boolean;
  color?: string;
}

export function FlowLine({ edge, from, to, active, color = "#22d3ee" }: FlowLineProps) {
  const path = buildPath(from, to);
  const lineColor = active ? color : "#475569";

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        opacity={active ? 0.55 : 0.35}
      />
      {active && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="6 10"
          strokeLinecap="round"
          style={{ animation: "azflow 1.4s linear infinite" }}
        />
      )}
      {edge.label && (
        <text
          x={midX(from, to)}
          y={midY(from, to) - 4}
          textAnchor="middle"
          className="fill-slate-500 text-[9px]"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

function buildPath(from: PlantNode, to: PlantNode): string {
  const fx = from.x + from.w;
  const fy = from.y + from.h / 2;
  const tx = to.x;
  const ty = to.y + to.h / 2;
  const midX = (fx + tx) / 2;
  return `M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`;
}

function midX(from: PlantNode, to: PlantNode) {
  return (from.x + from.w + to.x) / 2;
}
function midY(from: PlantNode, to: PlantNode) {
  return (from.y + from.h / 2 + to.y + to.h / 2) / 2;
}
