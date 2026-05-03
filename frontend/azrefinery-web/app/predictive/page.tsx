"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRulUpdates } from "@/lib/signalr/hooks";
import { equipmentApi } from "@/lib/api/equipment";
import type { EquipmentDto } from "@/lib/types/equipment";
import type { RulEstimateDto } from "@/lib/types/analytics";
import { Activity, Wrench } from "lucide-react";

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} мин`;
  if (hours < 24) return `${hours.toFixed(1)} ч`;
  const days = hours / 24;
  if (days < 30) return `${days.toFixed(1)} дн`;
  return `${(days / 30).toFixed(1)} мес`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function urgencyClass(hours: number): string {
  if (hours < 24) return "text-red-400";
  if (hours < 168) return "text-orange-400";
  if (hours < 720) return "text-amber-400";
  return "text-emerald-400";
}

export default function PredictivePage() {
  const rul = useRulUpdates();
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const loadEquipment = () => equipmentApi.list().then(setEquipment).catch(() => undefined);

  useEffect(() => {
    loadEquipment();
    const t = setInterval(loadEquipment, 5_000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const byId = new Map<string, RulEstimateDto>();
    for (const r of rul?.estimates ?? []) byId.set(r.equipmentId, r);
    return equipment
      .map((e) => ({ eq: e, rul: byId.get(e.id) }))
      .sort((a, b) => {
        // Сортируем по: 1) Failed/Critical first, 2) меньший RUL вверх
        const aHours = a.rul?.isAvailable ? a.rul.remainingHoursSimulated : Infinity;
        const bHours = b.rul?.isAvailable ? b.rul.remainingHoursSimulated : Infinity;
        return aHours - bHours;
      });
  }, [equipment, rul]);

  const handleMaintenance = async (id: string) => {
    setBusy(id);
    try {
      await equipmentApi.maintenance(id);
      await loadEquipment();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Предиктивный сервис</h1>
        <div className="text-xs text-slate-400 font-mono">
          {rul ? `обновлено ${new Date(rul.timestamp).toLocaleTimeString("ru-RU")}` : "ожидание данных…"}
        </div>
      </div>

      <div className="text-sm text-slate-400">
        Прогноз остаточного ресурса (RUL) рассчитывается линейной регрессией по истории деградации.
        Объекты отсортированы по срочности обслуживания.
      </div>

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">Нет данных об оборудовании</Card>
      ) : (
        <div className="space-y-2">
          {rows.map(({ eq, rul: r }) => (
            <Card key={eq.id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[220px]">
                  <Link
                    href={`/equipment/${eq.id}`}
                    className="text-base font-semibold hover:underline"
                  >
                    {eq.name}
                  </Link>
                  <div className="text-xs text-slate-500 font-mono">
                    {eq.id} · {eq.type}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-xs text-slate-400">Health</div>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[160px]">
                      <div
                        className={`h-full ${
                          eq.healthIndex > 70
                            ? "bg-emerald-500"
                            : eq.healthIndex > 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${eq.healthIndex}%` }}
                      />
                    </div>
                    <div className="font-mono text-xs w-10 text-right">
                      {eq.healthIndex.toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="min-w-[140px]">
                  <div className="text-xs text-slate-500">Остаточный ресурс</div>
                  {r?.isAvailable ? (
                    <>
                      <div className={`text-xl font-mono font-semibold ${urgencyClass(r.remainingHoursSimulated)}`}>
                        {formatHours(r.remainingHoursSimulated)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        confidence: {(r.confidence * 100).toFixed(0)}%
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500 italic">
                      {r?.recommendedAction ?? "ожидание истории"}
                    </div>
                  )}
                </div>

                <div className="min-w-[180px]">
                  <div className="text-xs text-slate-500">Прогноз отказа</div>
                  <div className="text-sm font-mono">
                    {r?.isAvailable ? formatDate(r.predictedFailureTime) : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Рекомендуемое ТО</div>
                  <div className="text-sm font-mono">
                    {r?.isAvailable ? formatDate(r.recommendedMaintenanceTime) : "—"}
                  </div>
                </div>

                <div className="min-w-[200px] flex-1">
                  <div className="text-xs text-slate-500">Действие</div>
                  <div className="text-sm flex items-start gap-1.5">
                    <Activity size={14} className="mt-0.5 text-cyan-400 shrink-0" />
                    <span>{r?.recommendedAction ?? "—"}</span>
                  </div>
                  <Button
                    onClick={() => handleMaintenance(eq.id)}
                    disabled={busy === eq.id}
                    className="mt-2 h-7 text-xs gap-1.5"
                    variant="outline"
                  >
                    <Wrench size={12} />
                    {busy === eq.id ? "Выполняется…" : "Провести обслуживание"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
