export const MANILA_TZ = "Asia/Manila";

/**
 * Dates are rendered in the server's local timezone. Set `TZ=Asia/Manila`
 * (see README) so schedules match Philippine Standard Time on deployment.
 */
export function fmtDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return `${fmtDate(value)} · ${fmtTime(value)}`;
}

export function fmtRange(start: Date | string, end: Date | string) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const sameDay = fmtDate(s) === fmtDate(e);
  return sameDay
    ? `${fmtDate(s)} · ${fmtTime(s)} – ${fmtTime(e)}`
    : `${fmtDateTime(s)} → ${fmtDateTime(e)}`;
}

export function peso(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function num(value: string | number | null | undefined, digits = 2) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-PH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function relative(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return "just now";
  if (Math.abs(mins) < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return fmtDate(d);
}

export function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (["available", "approved", "completed", "active", "published", "open", "confirmed", "attended"].includes(s))
    return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
  if (["pending", "submitted", "under review", "draft", "waiting", "invited", "scheduled (pending)"].includes(s))
    return "bg-amber-100 text-amber-800 ring-amber-600/20";
  if (["scheduled", "reserved", "upcoming", "assigned"].includes(s))
    return "bg-sky-100 text-sky-800 ring-sky-600/20";
  if (["in use", "in progress", "ongoing", "important"].includes(s))
    return "bg-indigo-100 text-indigo-800 ring-indigo-600/20";
  if (["under maintenance", "maintenance", "due", "rescheduled"].includes(s))
    return "bg-orange-100 text-orange-800 ring-orange-600/20";
  if (["rejected", "cancelled", "unavailable", "urgent", "conflict", "absent", "closed", "retired", "inactive"].includes(s))
    return "bg-rose-100 text-rose-800 ring-rose-600/20";
  return "bg-slate-100 text-slate-700 ring-slate-500/20";
}

export function slugTitle(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
