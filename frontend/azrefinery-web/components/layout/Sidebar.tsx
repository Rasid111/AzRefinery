"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  AlertTriangle,
  Activity,
  Workflow,
  Gauge,
  FlaskConical,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/equipment", label: "Оборудование", icon: Boxes },
  { href: "/anomalies", label: "Аномалии", icon: AlertTriangle },
  { href: "/predictive", label: "Предиктивный сервис", icon: Activity },
  { href: "/scenarios", label: "Сценарии", icon: Workflow },
  { href: "/whatif", label: "What-If", icon: FlaskConical },
  { href: "/kpi", label: "KPI", icon: Gauge },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="text-lg font-semibold text-slate-100">AzRefinery</div>
        <div className="text-xs text-slate-500">Цифровой двойник мини-НПЗ</div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
