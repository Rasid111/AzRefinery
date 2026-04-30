"use client";

import Link from "next/link";
import type { DisplayAnchor, PlantNode } from "@/lib/plant/layout";
import type { EquipmentSnapshot } from "@/lib/types/telemetry";
import type { EquipmentStatus } from "@/lib/types/equipment";
import { STATUS_HEX } from "@/lib/plant/statusColors";
import { EquipmentShape } from "./shapes";

interface EquipmentNodeProps {
  node: PlantNode;
  snapshot?: EquipmentSnapshot;
  onHoverChange?: (id: string | null) => void;
  hovered?: boolean;
}

export function EquipmentNode({ node, snapshot, onHoverChange, hovered }: EquipmentNodeProps) {
  const status: EquipmentStatus = snapshot?.status ?? "Stopped";
  const color = STATUS_HEX[status];
  const cx = node.x + node.w / 2;
  const tankFill = hasLiquidFill(node.type) ? snapshot?.sensors?.LEVEL : undefined;

  return (
    <Link
      href={`/equipment/${node.id}`}
      className="group focus:outline-none"
      aria-label={node.name}
    >
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHoverChange?.(node.id)}
        onMouseLeave={() => onHoverChange?.(null)}
        onFocus={() => onHoverChange?.(node.id)}
        onBlur={() => onHoverChange?.(null)}
      >
        <EquipmentShape node={node} status={status} color={color} fill={tankFill} />

        {(status === "Critical" || status === "Failed") && (
          <circle
            cx={node.x + 10}
            cy={node.y + 10}
            r={5}
            fill={color}
            className="animate-pulse"
          />
        )}

        {node.displays?.map((d) => {
          const value = snapshot?.sensors?.[d.sensor];
          if (typeof value !== "number" || !Number.isFinite(value)) return null;
          const pos = anchorPos(node, d.anchor);
          const fontSize = d.fontSize ?? 12;
          return (
            <text
              key={d.sensor}
              x={pos.x}
              y={pos.y}
              textAnchor={pos.textAnchor}
              fill={color}
              fontFamily="var(--font-geist-mono)"
              fontSize={fontSize}
              fontWeight={600}
              className="tabular-nums"
            >
              {formatValue(value, d.unit)}
              <tspan dx={2} fontSize={fontSize - 3} fill="#94a3b8">
                {d.unit}
              </tspan>
            </text>
          );
        })}

        <text
          x={cx}
          y={node.y + node.h + 15}
          textAnchor="middle"
          className="fill-slate-300 text-[11px]"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {node.name}
        </text>
        <text
          x={cx}
          y={node.y + node.h + 27}
          textAnchor="middle"
          className="fill-slate-500 text-[9px]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {node.id}
        </text>

        <rect
          x={node.x - 4}
          y={node.y - 4}
          width={node.w + 8}
          height={node.h + 8}
          fill="none"
          stroke={color}
          strokeWidth={1}
          rx={6}
          className={`transition-opacity ${
            hovered ? "opacity-80" : "opacity-0 group-hover:opacity-60"
          }`}
        />
      </g>
    </Link>
  );
}

function hasLiquidFill(type: PlantNode["type"]): boolean {
  return (
    type === "CrudeTank" ||
    type === "ProductTank" ||
    type === "DistillationColumn"
  );
}

function anchorPos(node: PlantNode, anchor: DisplayAnchor) {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  switch (anchor) {
    case "top":
      return { x: cx, y: node.y + 22, textAnchor: "middle" as const };
    case "bottom":
      return { x: cx, y: node.y + node.h - 14, textAnchor: "middle" as const };
    case "center":
      return { x: cx, y: cy + 4, textAnchor: "middle" as const };
    case "left":
      return { x: node.x + 14, y: cy + 4, textAnchor: "start" as const };
    case "right":
      return { x: node.x + node.w - 14, y: cy + 4, textAnchor: "end" as const };
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === "%") return value.toFixed(1);
  if (unit === "bar") return value.toFixed(2);
  if (Math.abs(value) >= 100) return value.toFixed(0);
  return value.toFixed(1);
}
