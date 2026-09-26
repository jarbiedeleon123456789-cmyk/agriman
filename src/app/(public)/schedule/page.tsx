import Link from "next/link";
import { Badge, Banner, Card, EmptyState, MonthCalendar, TableShell, btn, inputClass } from "@/components/ui";
import { listBarangays, listEquipment, listReservations, reservationFarmerNames, schedulingConflicts } from "@/lib/queries";
import { addMonths, fmtDate, fmtRange, startOfMonth } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";

export const dynamic = "force-dynamic";

export default async function PublicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; barangay?: string; view?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ? new Date(`${sp.month}-01T00:00:00`) : startOfMonth(new Date());
  const barangayId = sp.barangay && sp.barangay !== "all" ? Number(sp.barangay) : undefined;
  const harvesterOnly = (sp.type ?? "harvester") === "harvester";
  const view = sp.view ?? "month";

  const from = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 2, 0);

  const [reservations, barangays, equipment, conflicts] = await Promise.all([
    listReservations({ from, to, barangayId, harvesterOnly }),
    listBarangays(),
    listEquipment(),
    schedulingConflicts(),
  ]);

  const farmerNames = await reservationFarmerNames(
    reservations.map((r) => r.farmerId).filter((x): x is number => typeof x === "number"),
  );

  const conflictIds = new Set(conflicts.flatMap((c) => [c.a.id, c.b.id]));
  const events = reservations.map((r) => ({
    id: r.id,
    date: new Date(r.startAt),
    end: new Date(r.endAt),
    title: `${r.assetCode ?? ""} · ${r.barangay ?? ""}`,
    tone: r.status,
    meta: r.serviceType,
    conflict: conflictIds.has(r.id),
  }));

  const today = new Date();
  const dayList = reservations.filter((r) => new Date(r.startAt).toDateString() === today.toDateString());
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekList = reservations.filter((r) => new Date(r.startAt) >= today && new Date(r.startAt) <= weekEnd);
  const monthList = reservations.filter(
    (r) => new Date(r.startAt).getMonth() === month.getMonth() && new Date(r.startAt).getFullYear() === month.getFullYear(),
  );
  const list = view === "day" ? dayList : view === "week" ? weekList : monthList;

  const harvesters = equipment.filter((e) => e.category === "Combine Harvester");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHero
        eyebrow="Municipal deployment calendar"
        title="Harvester & equipment schedule"
        sub="Overlapping bookings are highlighted so conflicts are visually obvious before they ever reach the field."
        emoji="🗓️"
        actions={
          <Link href="/dashboard/requests/new" className={btn.primary}>
            📋 Book a service
          </Link>
        }
      />

      {conflicts.length > 0 && (
        <div className="mb-6">
          <Banner tone="warn" title={`${conflicts.length} scheduling conflict(s) detected municipality-wide`}>
            <ul className="mt-1 list-disc pl-5">
              {conflicts.slice(0, 3).map((c, i) => (
                <li key={i}>
                  {c.a.equipmentName}: {fmtRange(c.a.startAt, c.a.endAt)} overlaps {fmtRange(c.b.startAt, c.b.endAt)}
                </li>
              ))}
            </ul>
          </Banner>
        </div>
      )}

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Month</span>
          <input type="month" name="month" defaultValue={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Barangay</span>
          <select name="barangay" defaultValue={sp.barangay ?? "all"} className={inputClass}>
            <option value="all">All barangays</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Service</span>
          <select name="type" defaultValue={sp.type ?? "harvester"} className={inputClass}>
            <option value="harvester">Harvester only</option>
            <option value="all">All equipment</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">View</span>
          <select name="view" defaultValue={view} className={inputClass}>
            <option value="month">Monthly</option>
            <option value="week">Weekly</option>
            <option value="day">Daily</option>
          </select>
        </label>
        <button className={btn.primary}>Apply</button>
        <Link href={`/schedule?month=${addMonths(month, -1).toISOString().slice(0, 7)}`} className={btn.ghost}>
          ← Prev
        </Link>
        <Link href={`/schedule?month=${addMonths(month, 1).toISOString().slice(0, 7)}`} className={btn.ghost}>
          Next →
        </Link>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={`📅 ${month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`}
            subtitle={`${monthList.length} scheduled deployment(s)`}
          >
            <MonthCalendar month={month} events={events} />
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-sky-200" /> Scheduled
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-indigo-200" /> In progress
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-emerald-200" /> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-rose-200" /> ⚠ Conflict
              </span>
            </div>
          </Card>

          <Card title={`🗒️ ${view === "day" ? "Today" : view === "week" ? "This week" : "Monthly"} deployment list`}>
            {list.length ? (
              <TableShell head={["Schedule", "Equipment", "Service", "Barangay", "Farmer", "Operator", "Status"]}>
                {list.map((r) => (
                  <tr key={r.id} className={conflictIds.has(r.id) ? "bg-rose-50" : ""}>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700">{fmtRange(r.startAt, r.endAt)}</td>
                    <td className="px-3 py-2 text-xs">{r.equipmentName}</td>
                    <td className="px-3 py-2 text-xs">{r.serviceType}</td>
                    <td className="px-3 py-2 text-xs">{r.barangay ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{r.farmerId ? farmerNames.get(r.farmerId) ?? "—" : "—"}</td>
                    <td className="px-3 py-2 text-xs">{r.operatorName ?? "Unassigned"}</td>
                    <td className="px-3 py-2">
                      <Badge value={conflictIds.has(r.id) ? "Conflict" : r.status} />
                    </td>
                  </tr>
                ))}
              </TableShell>
            ) : (
              <EmptyState icon="🗓️" title="No deployments for this period" hint="Try another month, barangay or view." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="🌾 Harvester fleet status">
            <ul className="space-y-2">
              {harvesters.map((h) => (
                <li key={h.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800">{h.name}</span>
                    <Badge value={h.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {h.assetCode} · {h.capacityNote} · Brgy. {h.barangay ?? "—"}
                  </p>
                  <Link href={`/equipment/${h.id}`} className="mt-2 inline-block text-xs font-bold text-emerald-700 hover:underline">
                    Availability →
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="ℹ️ Booking rules">
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• Minimum lead time of 3 days before the target service date.</li>
              <li>• A unit cannot be double-booked — overlaps are rejected automatically.</li>
              <li>• When no unit is free, the request joins the barangay waiting list.</li>
              <li>• MAO approval is required before a schedule becomes final.</li>
              <li>• Cancellations should be filed at least 24 hours before the schedule.</li>
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">Calendar generated {fmtDate(new Date())}.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
