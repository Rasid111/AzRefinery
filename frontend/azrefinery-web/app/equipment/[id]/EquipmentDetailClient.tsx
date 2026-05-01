"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { equipmentApi } from "@/lib/api/equipment";
import { historyApi } from "@/lib/api/history";
import { usePlantStore } from "@/lib/store/plantStore";
import {
  STATUS_LABEL,
  STATUS_TW_BG,
  STATUS_TW_DOT,
  STATUS_TW_TEXT,
} from "@/lib/plant/statusColors";
import type { EquipmentDto, SensorDto } from "@/lib/types/equipment";
import type {
  EquipmentEventDto,
  TelemetryReadingDto,
  AnomalyEventMetadata,
} from "@/lib/types/history";
import { TelemetryChart } from "@/components/charts/TelemetryChart";
import { DegradationChart } from "@/components/charts/DegradationChart";

type EventTypeKey = EquipmentEventDto["type"];

const EVENT_LABEL: Record<EventTypeKey, string> = {
  StatusChange: "Смена статуса",
  AnomalyDetected: "Аномалия",
  SetpointChanged: "Изменение уставки",
  MaintenancePerformed: "Обслуживание",
  ScenarioTriggered: "Сценарий",
  Failure: "Отказ",
};

const EVENT_DOT: Record<EventTypeKey, string> = {
  StatusChange: "bg-slate-400",
  AnomalyDetected: "bg-amber-400",
  SetpointChanged: "bg-cyan-400",
  MaintenancePerformed: "bg-emerald-400",
  ScenarioTriggered: "bg-violet-400",
  Failure: "bg-red-500",
};

export function EquipmentDetailClient({ id }: { id: string }) {
  const [base, setBase] = useState<EquipmentDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = usePlantStore((s) => s.equipment.get(id) ?? null);

  const reload = useCallback(() => {
    equipmentApi
      .get(id)
      .then(setBase)
      .catch((e) => setError(String(e?.message ?? e)));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (error) {
    return <div className="text-sm text-red-400">Ошибка загрузки: {error}</div>;
  }
  if (!base) {
    return <div className="text-sm text-slate-400">Загрузка...</div>;
  }

  const status = live?.status ?? base.status;
  const health = live?.healthIndex ?? base.healthIndex;
  const degradation = live?.degradationLevel ?? base.degradationLevel;
  const readings: Record<string, number> =
    (live?.sensors as Record<string, number>) ?? base.readings;

  return (
    <div className="space-y-4">
      <Header
        name={base.name}
        id={base.id}
        type={base.type}
        status={status}
        health={health}
        degradation={degradation}
        commissionedAt={base.commissionedAt}
      />

      <Tabs defaultValue="params">
        <TabsList>
          <TabsTrigger value="params">Параметры</TabsTrigger>
          <TabsTrigger value="setpoints">Уставки</TabsTrigger>
          <TabsTrigger value="degradation">Деградация</TabsTrigger>
          <TabsTrigger value="events">События</TabsTrigger>
        </TabsList>

        <TabsContent value="params">
          <ParametersTab sensors={base.sensors} readings={readings} />
        </TabsContent>
        <TabsContent value="setpoints">
          <SetpointsTab
            id={id}
            setpoints={base.setpoints}
            onSaved={reload}
          />
        </TabsContent>
        <TabsContent value="degradation">
          <DegradationTab id={id} onMaintenance={reload} />
        </TabsContent>
        <TabsContent value="events">
          <EventsTab id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Header ----------

function Header({
  name,
  id,
  type,
  status,
  health,
  degradation,
  commissionedAt,
}: {
  name: string;
  id: string;
  type: string;
  status: import("@/lib/types/equipment").EquipmentStatus;
  health: number;
  degradation: number;
  commissionedAt: string;
}) {
  const since = useMemo(() => {
    const ms = Date.now() - new Date(commissionedAt).getTime();
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    return `${days} д ${hours} ч`;
  }, [commissionedAt]);

  return (
    <Card className={`p-4 border ${STATUS_TW_BG[status]}`}>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono">{id}</span>
            <span>·</span>
            <span>{type}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">{name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${STATUS_TW_DOT[status]}`} />
            <span className={STATUS_TW_TEXT[status]}>{STATUS_LABEL[status]}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Gauge value={health} label="Health" suffix="%" />
          <Stat label="Деградация" value={`${(degradation * 100).toFixed(1)}%`} />
          <Stat label="В эксплуатации" value={since} />
        </div>
      </div>
    </Card>
  );
}

function Gauge({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444";
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} stroke="#1e293b" strokeWidth={8} fill="none" />
        <circle
          cx={40}
          cy={40}
          r={r}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
        <text
          x={40}
          y={45}
          textAnchor="middle"
          className="font-mono"
          fontSize="16"
          fill="#e2e8f0"
        >
          {v.toFixed(0)}
        </text>
      </svg>
      <div className="text-xs text-slate-400">
        {label}
        <div className="text-slate-200 font-mono text-sm">{value.toFixed(1)}{suffix}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs text-slate-400">
      {label}
      <div className="text-slate-200 font-mono text-base">{value}</div>
    </div>
  );
}

// ---------- Params ----------

function ParametersTab({
  sensors,
  readings,
}: {
  sensors: SensorDto[];
  readings: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {sensors.map((s) => (
        <SensorChartCard key={s.id} sensor={s} current={readings[s.code] ?? s.currentValue} />
      ))}
    </div>
  );
}

function SensorChartCard({
  sensor,
  current,
}: {
  sensor: SensorDto;
  current: number;
}) {
  const [data, setData] = useState<TelemetryReadingDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      historyApi
        .sensor(sensor.id, { maxPoints: 200 })
        .then((d) => {
          if (active) {
            setData(d);
            setLoading(false);
          }
        })
        .catch(() => active && setLoading(false));
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [sensor.id]);

  const inRange = current >= sensor.minValue && current <= sensor.maxValue;
  const valueColor = inRange ? "text-slate-100" : "text-orange-400";

  return (
    <Card className="p-3">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div>
          <div className="text-xs uppercase text-slate-500 tracking-wide">{sensor.code}</div>
          <div className="text-xs text-slate-400">
            норма {sensor.minValue}–{sensor.maxValue} {sensor.unit}
            {" · номинал "}
            {sensor.nominalValue} {sensor.unit}
          </div>
        </div>
        <div className={`font-mono text-xl ${valueColor}`}>
          {current.toFixed(2)} <span className="text-xs text-slate-500">{sensor.unit}</span>
        </div>
      </div>
      {loading ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-slate-500">
          Загрузка истории...
        </div>
      ) : (
        <TelemetryChart
          data={data}
          unit={sensor.unit}
          nominal={sensor.nominalValue}
          min={sensor.minValue}
          max={sensor.maxValue}
          height={180}
        />
      )}
    </Card>
  );
}

// ---------- Setpoints ----------

function SetpointsTab({
  id,
  setpoints,
  onSaved,
}: {
  id: string;
  setpoints: Record<string, number>;
  onSaved: () => void;
}) {
  const entries = Object.entries(setpoints);
  if (entries.length === 0) {
    return (
      <Card className="p-4 text-sm text-slate-400">У этого объекта нет уставок.</Card>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map(([name, value]) => (
        <SetpointRow key={name} id={id} name={name} value={value} onSaved={onSaved} />
      ))}
    </div>
  );
}

function SetpointRow({
  id,
  name,
  value,
  onSaved,
}: {
  id: string;
  name: string;
  value: number;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setDraft(String(value)), [value]);

  const save = async () => {
    const v = Number(draft);
    if (Number.isNaN(v)) {
      setErr("Не число");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await equipmentApi.setSetpoint(id, name, v);
      onSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="font-mono text-sm text-slate-200">{name}</div>
        <div className="text-xs text-slate-500">текущая: {value}</div>
      </div>
      <Input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-32 font-mono"
        step="any"
      />
      <Button onClick={save} disabled={busy || draft === String(value)}>
        Применить
      </Button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </Card>
  );
}

// ---------- Degradation ----------

function DegradationTab({ id, onMaintenance }: { id: string; onMaintenance: () => void }) {
  const [data, setData] = useState<TelemetryReadingDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    historyApi
      .degradation(id, { maxPoints: 300 })
      .then(setData)
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const doMaintenance = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await equipmentApi.maintenance(id);
      setMsg("Обслуживание проведено: деградация сброшена");
      onMaintenance();
      load();
    } catch (e) {
      setMsg(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-medium text-slate-100">История деградации</div>
            <div className="text-xs text-slate-500">
              предупреждение при 70%, отказ при 100%. RUL-прогноз появится на этапе 8.
            </div>
          </div>
          <Button onClick={doMaintenance} disabled={busy}>
            {busy ? "Выполняется..." : "Провести обслуживание"}
          </Button>
        </div>
        <DegradationChart data={data} height={260} />
        {msg && <div className="text-xs text-emerald-400 mt-2">{msg}</div>}
      </Card>
    </div>
  );
}

// ---------- Events ----------

function EventsTab({ id }: { id: string }) {
  const [events, setEvents] = useState<EquipmentEventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      historyApi
        .events(id)
        .then((e) => {
          if (active) {
            setEvents([...e].reverse());
            setLoading(false);
          }
        })
        .catch(() => active && setLoading(false));
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id]);

  if (loading) return <div className="text-sm text-slate-400">Загрузка...</div>;
  if (events.length === 0) {
    return (
      <Card className="p-4 text-sm text-slate-400">События пока не зарегистрированы.</Card>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((e) => {
        const meta = (e.metadata ?? {}) as AnomalyEventMetadata & {
          previousStatus?: string;
          newStatus?: string;
        };
        return (
          <Card key={e.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2 w-2 rounded-full ${EVENT_DOT[e.type]}`} />
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {EVENT_LABEL[e.type]}
                </span>
                {meta.sensorCode && (
                  <span className="font-mono text-xs text-slate-300">
                    · {meta.sensorCode}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                {new Date(e.timestamp).toLocaleString("ru-RU", { hour12: false })}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-200">{e.message}</p>
          </Card>
        );
      })}
    </div>
  );
}
