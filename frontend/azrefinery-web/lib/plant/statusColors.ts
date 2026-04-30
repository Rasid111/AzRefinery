import type { EquipmentStatus } from "@/lib/types/equipment";

export const STATUS_LABEL: Record<EquipmentStatus, string> = {
  Running: "В норме",
  Warning: "Предупреждение",
  Critical: "Критично",
  Stopped: "Остановлено",
  Failed: "Отказ",
};

export const STATUS_HEX: Record<EquipmentStatus, string> = {
  Running: "#10b981",
  Warning: "#f59e0b",
  Critical: "#f97316",
  Failed: "#ef4444",
  Stopped: "#64748b",
};

export const STATUS_TW_TEXT: Record<EquipmentStatus, string> = {
  Running: "text-emerald-400",
  Warning: "text-amber-400",
  Critical: "text-orange-400",
  Failed: "text-red-400",
  Stopped: "text-slate-400",
};

export const STATUS_TW_BG: Record<EquipmentStatus, string> = {
  Running: "bg-emerald-500/15 border-emerald-500/40",
  Warning: "bg-amber-500/15 border-amber-500/40",
  Critical: "bg-orange-500/15 border-orange-500/40",
  Failed: "bg-red-500/15 border-red-500/40",
  Stopped: "bg-slate-700/30 border-slate-600/60",
};

export const STATUS_TW_DOT: Record<EquipmentStatus, string> = {
  Running: "bg-emerald-500",
  Warning: "bg-amber-500",
  Critical: "bg-orange-500",
  Failed: "bg-red-500",
  Stopped: "bg-slate-500",
};
