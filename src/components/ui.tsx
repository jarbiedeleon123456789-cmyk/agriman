import Link from "next/link";
import type { ReactNode } from "react";
import { statusTone } from "@/lib/utils";

export function Badge({ children, value }: { children?: ReactNode; value?: string }) {
  const label = value ?? String(children ?? "");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusTone(
        label,
      )}`}
    >
      {label}
    </span>
  );
}

export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">{eyebrow}</p>
      <h2 className="font-display mt-3 text-4xl font-medium tracking-tight text-emerald-950 sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{sub}</p>}
    </div>
  );
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-[1.4rem] border border-emerald-950/10 bg-white shadow-[0_1px_2px_rgba(10,31,20,0.05),0_12px_32px_-16px_rgba(10,31,20,0.18)] ${className}`}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/10 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "emerald",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: string;
  tone?: "emerald" | "amber" | "sky" | "rose" | "slate";
  href?: string;
}) {
  const tones: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-700",
    amber: "from-amber-500/10 to-amber-500/0 text-amber-700",
    sky: "from-sky-500/10 to-sky-500/0 text-sky-700",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-700",
    slate: "from-slate-500/10 to-slate-500/0 text-slate-700",
  };
  const body = (
    <div
      className={`rounded-[1.2rem] border border-emerald-950/10 bg-gradient-to-br ${tones[tone]} bg-white p-4 shadow-[0_8px_24px_-16px_rgba(10,31,20,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(10,31,20,0.4)]`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <span className="text-xl leading-none">{icon}</span>}
      </div>
      <p className="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function EmptyState({ icon = "🌱", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-900/20 bg-emerald-50/40 px-6 py-10 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="mt-2 text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="mt-1 max-w-md text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(4,120,87,0.7)] transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-[0_14px_30px_-12px_rgba(4,120,87,0.8)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:translate-y-0 active:scale-[0.98] disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow active:translate-y-0 active:scale-[0.98]",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700 active:translate-y-0 active:scale-[0.98]",
  small:
    "inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-800 active:translate-y-0 active:scale-[0.98]",
  smallGhost:
    "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]",
};

export function Disclosure({
  summary,
  children,
  tone = "primary",
  open = false,
}: {
  summary: string;
  children: ReactNode;
  tone?: "primary" | "ghost";
  open?: boolean;
}) {
  return (
    <details open={open} className="group">
      <summary className={`${tone === "primary" ? btn.primary : btn.smallGhost} cursor-pointer list-none`}>
        <span>{summary}</span>
      </summary>
      <div className="mt-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/40 p-4">{children}</div>
    </details>
  );
}

export function TableShell({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Banner({ tone = "info", title, children }: { tone?: "info" | "warn" | "success" | "danger"; title: string; children?: ReactNode }) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-rose-200 bg-rose-50 text-rose-900",
  } as const;
  const icons = { info: "ℹ️", warn: "⚠️", success: "✅", danger: "⛔" } as const;
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>
      <p className="font-semibold">
        {icons[tone]} {title}
      </p>
      {children && <div className="mt-1 text-[13px] leading-relaxed">{children}</div>}
    </div>
  );
}

/* ------------------------------- charts ------------------------------ */

export function BarChart({ data, unit = "" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <EmptyState icon="📊" title="No data to visualise yet" />;
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(90px,150px)_1fr_auto] items-center gap-3">
          <span className="truncate text-xs font-medium text-slate-600" title={d.label}>
            {d.label}
          </span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-400"
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
            />
          </span>
          <span className="w-14 text-right text-xs font-bold text-slate-700">
            {d.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return <EmptyState icon="📈" title="No trend data yet" />;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-bold text-slate-600">{d.value}</span>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-emerald-700 to-lime-400"
            style={{ height: `${Math.max(6, (d.value / max) * 130)}px` }}
          />
          <span className="truncate text-[10px] text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const palette = ["#059669", "#0284c7", "#f59e0b", "#e11d48", "#7c3aed", "#0f766e", "#64748b"];
  let offset = 0;
  const stops = data.map((d, i) => {
    const start = (offset / total) * 100;
    offset += d.value;
    const end = (offset / total) * 100;
    return `${palette[i % palette.length]} ${start}% ${end}%`;
  });
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      >
        <div className="flex size-full items-center justify-center">
          <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white text-center">
            <span className="text-lg font-black text-slate-900">{total}</span>
            <span className="text-[10px] uppercase text-slate-500">total</span>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: palette[i % palette.length] }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-bold text-slate-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ calendar ----------------------------- */

export type CalEvent = {
  id: number | string;
  date: Date;
  end?: Date;
  title: string;
  tone?: string;
  meta?: string;
  href?: string;
  conflict?: boolean;
};

export function MonthCalendar({
  month,
  events,
  baseHref,
}: {
  month: Date;
  events: CalEvent[];
  baseHref?: string;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-950/10">
      <div className="grid grid-cols-7 bg-emerald-950 text-center text-[11px] font-bold uppercase tracking-wide text-lime-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {cells.map((day, i) => {
          const dayEvents = day
            ? events.filter(
                (e) =>
                  e.date.getFullYear() === day.getFullYear() &&
                  e.date.getMonth() === day.getMonth() &&
                  e.date.getDate() === day.getDate(),
              )
            : [];
          const isToday = day && today.toDateString() === day.toDateString();
          return (
            <div
              key={i}
              className={`min-h-[104px] bg-white p-1.5 ${day ? "" : "bg-slate-50"} ${isToday ? "ring-2 ring-inset ring-emerald-500" : ""}`}
            >
              {day && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? "text-emerald-700" : "text-slate-500"}`}>
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 2 && <span className="text-[10px] text-slate-400">{dayEvents.length}</span>}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => {
                      const content = (
                        <span
                          className={`block truncate rounded px-1.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                            e.conflict ? "bg-rose-100 text-rose-800 ring-rose-500/30" : statusTone(e.tone ?? "scheduled")
                          }`}
                          title={`${e.title}${e.meta ? ` · ${e.meta}` : ""}`}
                        >
                          {e.conflict ? "⚠ " : ""}
                          {e.title}
                        </span>
                      );
                      return e.href || baseHref ? (
                        <Link key={e.id} href={e.href ?? `${baseHref}`}>
                          {content}
                        </Link>
                      ) : (
                        <div key={e.id}>{content}</div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
