"use client";

interface KpiGaugeProps {
  label: string;
  value: number;
  unit?: string;
  size?: number;
  thresholds?: { warning: number; critical: number };
}

export function KpiGauge({
  label,
  value,
  unit = "%",
  size = 140,
  thresholds = { warning: 70, critical: 50 },
}: KpiGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);

  const color =
    value < thresholds.critical
      ? "#ef4444"
      : value < thresholds.warning
      ? "#f59e0b"
      : "#10b981";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} stroke="#1e293b" strokeWidth={8} fill="none" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-2xl font-semibold" style={{ color }}>
            {value.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500">{unit}</div>
        </div>
      </div>
      <div className="text-sm text-slate-300 uppercase tracking-wider">{label}</div>
    </div>
  );
}
