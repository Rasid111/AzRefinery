"use client";

import type { PlantNode } from "@/lib/plant/layout";
import type { EquipmentSnapshot } from "@/lib/types/telemetry";
import { PLANT_VIEWBOX } from "@/lib/plant/layout";
import { STATUS_HEX, STATUS_LABEL } from "@/lib/plant/statusColors";

interface NodeTooltipProps {
  node: PlantNode;
  snapshot?: EquipmentSnapshot;
}

const TOOLTIP_W = 230;
const TOOLTIP_PAD = 10;
const ROW_H = 16;
const HEADER_H = 56;

export function NodeTooltip({ node, snapshot }: NodeTooltipProps) {
  const sensors = snapshot?.sensors ?? {};
  const entries = Object.entries(sensors);
  const status = snapshot?.status ?? "Stopped";
  const color = STATUS_HEX[status];

  const tooltipH = HEADER_H + Math.max(1, entries.length) * ROW_H + TOOLTIP_PAD;

  // Place to the right by default, or left if it would overflow.
  let x = node.x + node.w + 12;
  if (x + TOOLTIP_W > PLANT_VIEWBOX.w - 4) {
    x = node.x - TOOLTIP_W - 12;
  }
  if (x < 4) x = 4;

  let y = node.y;
  if (y + tooltipH > PLANT_VIEWBOX.h - 4) {
    y = PLANT_VIEWBOX.h - tooltipH - 4;
  }
  if (y < 4) y = 4;

  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={TOOLTIP_W}
        height={tooltipH}
        rx={6}
        fill="#0b1220"
        stroke={color}
        strokeWidth={1}
        opacity={0.98}
      />
      <text
        x={x + TOOLTIP_PAD}
        y={y + 16}
        className="fill-slate-100 text-[11px] font-semibold"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        {node.name}
      </text>
      <text
        x={x + TOOLTIP_W - TOOLTIP_PAD}
        y={y + 16}
        textAnchor="end"
        fill={color}
        className="text-[10px] uppercase tracking-wider"
      >
        {STATUS_LABEL[status]}
      </text>
      <text
        x={x + TOOLTIP_PAD}
        y={y + 30}
        className="fill-slate-500 text-[9px]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {node.id}
      </text>
      {typeof snapshot?.healthIndex === "number" && (
        <text
          x={x + TOOLTIP_W - TOOLTIP_PAD}
          y={y + 30}
          textAnchor="end"
          fill={color}
          className="text-[10px] tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          H {snapshot.healthIndex.toFixed(1)} · D{" "}
          {(snapshot.degradationLevel * 100).toFixed(2)}%
        </text>
      )}
      <line
        x1={x + TOOLTIP_PAD}
        x2={x + TOOLTIP_W - TOOLTIP_PAD}
        y1={y + 42}
        y2={y + 42}
        stroke="#1e293b"
        strokeWidth={1}
      />

      {entries.length === 0 ? (
        <text
          x={x + TOOLTIP_W / 2}
          y={y + HEADER_H + ROW_H / 2 + 3}
          textAnchor="middle"
          className="fill-slate-500 text-[10px] italic"
        >
          нет данных
        </text>
      ) : (
        entries.map(([code, value], i) => (
          <g key={code} transform={`translate(${x}, ${y + HEADER_H + i * ROW_H})`}>
            <text
              x={TOOLTIP_PAD}
              y={11}
              className="fill-slate-400 text-[10px]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {code}
            </text>
            <text
              x={TOOLTIP_W - TOOLTIP_PAD}
              y={11}
              textAnchor="end"
              className="fill-slate-100 text-[10px] tabular-nums"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {Number.isFinite(value) ? value.toFixed(2) : "—"}
            </text>
          </g>
        ))
      )}
    </g>
  );
}
