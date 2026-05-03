"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { equipmentApi } from "@/lib/api/equipment";
import { usePlantStore } from "@/lib/store/plantStore";
import type { EquipmentDto, EquipmentStatus, EquipmentType } from "@/lib/types/equipment";

const STATUS_LABEL: Record<EquipmentStatus, string> = {
  Running: "Работает",
  Warning: "Предупреждение",
  Critical: "Критическое",
  Stopped: "Остановлено",
  Failed: "Отказ",
};

const STATUS_COLOR: Record<EquipmentStatus, string> = {
  Running: "bg-emerald-500",
  Warning: "bg-amber-500",
  Critical: "bg-orange-500",
  Stopped: "bg-slate-500",
  Failed: "bg-red-500",
};

const TYPE_LABEL: Record<EquipmentType, string> = {
  CrudeTank: "Резервуар сырой нефти",
  FeedPump: "Насос подачи",
  HeatExchanger: "Теплообменник",
  DistillationColumn: "Ректификационная колонна",
  ProductTank: "Продуктовый резервуар",
};

export default function EquipmentListPage() {
  const [list, setList] = useState<EquipmentDto[]>([]);
  const [filter, setFilter] = useState<EquipmentStatus | "All">("All");
  const liveById = usePlantStore((s) => s.equipment);

  useEffect(() => {
    equipmentApi.list().then(setList).catch(() => undefined);
  }, []);

  // Накладываем live-снимок поверх первоначальной загрузки.
  const merged = useMemo(() => {
    return list.map((e) => {
      const live = liveById.get(e.id);
      return live
        ? { ...e, status: live.status, healthIndex: live.healthIndex, degradationLevel: live.degradationLevel }
        : e;
    });
  }, [list, liveById]);

  const counts = useMemo(() => {
    const c: Record<EquipmentStatus, number> = {
      Running: 0, Warning: 0, Critical: 0, Stopped: 0, Failed: 0,
    };
    for (const e of merged) c[e.status]++;
    return c;
  }, [merged]);

  const filtered = useMemo(
    () => (filter === "All" ? merged : merged.filter((e) => e.status === filter)),
    [merged, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Оборудование</h1>
        <div className="text-xs text-slate-400 font-mono">
          всего: {merged.length} · показано: {filtered.length}
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Статус:</span>
          <Chip active={filter === "All"} onClick={() => setFilter("All")}>
            Все ({merged.length})
          </Chip>
          {(Object.keys(STATUS_LABEL) as EquipmentStatus[]).map((s) => (
            <Chip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              dot={STATUS_COLOR[s]}
            >
              {STATUS_LABEL[s]} ({counts[s]})
            </Chip>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">
          {merged.length === 0 ? "Загрузка списка…" : "Под выбранный фильтр ничего не подходит."}
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {filtered.map((e) => (
            <Link key={e.id} href={`/equipment/${e.id}`} className="block group">
              <Card className="p-4 transition-colors group-hover:border-slate-700">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${STATUS_COLOR[e.status]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold truncate">{e.name}</div>
                      <div className="text-xs font-mono text-slate-500 shrink-0">{e.id}</div>
                    </div>
                    <div className="text-xs text-slate-500">{TYPE_LABEL[e.type]}</div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="text-xs text-slate-400 shrink-0">Health</div>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            e.healthIndex > 70
                              ? "bg-emerald-500"
                              : e.healthIndex > 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${e.healthIndex}%` }}
                        />
                      </div>
                      <div className="font-mono text-xs w-10 text-right">
                        {e.healthIndex.toFixed(0)}%
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`${statusTextColor(e.status)}`}>
                        {STATUS_LABEL[e.status]}
                      </span>
                      <span className="font-mono text-slate-500">
                        деградация {(e.degradationLevel * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function statusTextColor(s: EquipmentStatus): string {
  switch (s) {
    case "Running": return "text-emerald-400";
    case "Warning": return "text-amber-400";
    case "Critical": return "text-orange-400";
    case "Failed": return "text-red-400";
    case "Stopped": return "text-slate-500";
  }
}

function Chip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 px-3 text-xs rounded-full border transition flex items-center gap-1.5 ${
        active
          ? "bg-slate-100 text-slate-900 border-slate-100"
          : "bg-transparent text-slate-300 border-slate-700 hover:border-slate-500"
      }`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
      {children}
    </button>
  );
}
