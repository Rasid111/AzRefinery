"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryReadingDto } from "@/lib/types/history";

interface Props {
  data: TelemetryReadingDto[];
  unit?: string;
  nominal?: number;
  min?: number;
  max?: number;
  color?: string;
  height?: number;
}

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour12: false });
};

export function TelemetryChart({
  data,
  unit = "",
  nominal,
  min,
  max,
  color = "#22d3ee",
  height = 220,
}: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height }}
      >
        Нет данных за выбранный период
      </div>
    );
  }

  const series = data.map((p) => ({
    t: p.timestamp,
    v: p.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={fmtTime}
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          width={48}
          domain={["auto", "auto"]}
        />
        {min !== undefined && max !== undefined && (
          <ReferenceArea
            y1={min}
            y2={max}
            fill="#10b981"
            fillOpacity={0.05}
            stroke="none"
          />
        )}
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ color: "#cbd5e1" }}
          labelFormatter={(l) => fmtTime(String(l))}
          formatter={(v) => [`${Number(v).toFixed(2)} ${unit}`, ""]}
        />
        {nominal !== undefined && (
          <Line
            type="monotone"
            dataKey={() => nominal}
            stroke="#475569"
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
