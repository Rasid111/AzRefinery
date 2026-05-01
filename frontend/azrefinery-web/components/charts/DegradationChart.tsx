"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryReadingDto } from "@/lib/types/history";

interface Props {
  data: TelemetryReadingDto[];
  height?: number;
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("ru-RU", { hour12: false });

export function DegradationChart({ data, height = 220 }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height }}
      >
        Нет данных по деградации
      </div>
    );
  }
  const series = data.map((p) => ({ t: p.timestamp, v: p.value * 100 }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="degGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
          </linearGradient>
        </defs>
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
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" />
        <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ color: "#cbd5e1" }}
          labelFormatter={(l) => fmtTime(String(l))}
          formatter={(v) => [`${Number(v).toFixed(2)}%`, "Деградация"]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#degGrad)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
