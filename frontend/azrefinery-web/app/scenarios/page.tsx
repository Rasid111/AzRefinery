"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scenariosApi } from "@/lib/api/scenarios";
import { ApiError } from "@/lib/api/client";
import type { ScenarioDto } from "@/lib/types/analytics";
import { Play, Square, RotateCcw, Workflow } from "lucide-react";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioDto[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => scenariosApi.list().then(setScenarios).catch(() => undefined);

  useEffect(() => {
    load();
    const t = setInterval(load, 3_000);
    return () => clearInterval(t);
  }, []);

  const trigger = async (name: string) => {
    setBusy(name);
    setError(null);
    try {
      await scenariosApi.trigger(name);
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Не удалось запустить сценарий";
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (name: string) => {
    setBusy(name);
    setError(null);
    try {
      await scenariosApi.cancel(name);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const resetAll = async () => {
    setBusy("__reset__");
    setError(null);
    try {
      await scenariosApi.reset();
      await load();
    } finally {
      setBusy(null);
    }
  };

  const active = scenarios.filter((s) => s.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Сценарии деградации</h1>
        <Button
          onClick={resetAll}
          disabled={busy === "__reset__"}
          variant="outline"
          className="gap-1.5 text-xs h-8"
        >
          <RotateCcw size={14} />
          {busy === "__reset__" ? "Сброс…" : "Сбросить всё"}
        </Button>
      </div>

      <div className="text-sm text-slate-400">
        Запуск сценария меняет поведение конкретного объекта (ускоренный износ, утечка, потеря орошения и т.д.) —
        для демонстрации работы детектора аномалий и предиктивного сервиса.
      </div>

      {error && (
        <Card className="p-3 border-red-700 bg-red-950/40 text-sm text-red-300">{error}</Card>
      )}

      {active.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            Активные сценарии ({active.length})
          </div>
          <div className="space-y-2">
            {active.map((s) => (
              <Card key={s.name} className="p-3 border-orange-700 bg-orange-950/30">
                <div className="flex items-center gap-3">
                  <Workflow size={18} className="text-orange-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{s.displayName}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {s.name} → {s.targetEquipmentId}
                    </div>
                  </div>
                  <Button
                    onClick={() => cancel(s.name)}
                    disabled={busy === s.name}
                    variant="outline"
                    className="h-8 gap-1.5 text-xs border-orange-700"
                  >
                    <Square size={12} />
                    Отменить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
          Доступные сценарии
        </div>
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {scenarios.map((s) => (
            <Card key={s.name} className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Workflow
                  size={18}
                  className={s.isActive ? "text-orange-400 mt-0.5" : "text-cyan-400 mt-0.5"}
                />
                <div className="flex-1">
                  <div className="font-semibold">{s.displayName}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    цель: {s.targetEquipmentId}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
              <div className="flex justify-end">
                <Button
                  onClick={() => trigger(s.name)}
                  disabled={s.isActive || busy === s.name}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Play size={12} />
                  {s.isActive ? "Уже активен" : "Запустить"}
                </Button>
              </div>
            </Card>
          ))}
          {scenarios.length === 0 && (
            <Card className="p-8 text-center text-sm text-slate-400 col-span-full">
              Загрузка сценариев…
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
