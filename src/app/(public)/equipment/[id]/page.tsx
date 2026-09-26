import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, MonthCalendar, TableShell, btn } from "@/components/ui";
import MapView from "@/components/map-view";
import { equipmentSchedule, getEquipment, maintenanceFor, suggestSlots } from "@/lib/queries";
import { fmtDate, fmtRange, peso, startOfMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EquipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipmentId = Number(id);
  const item = await getEquipment(equipmentId);
  if (!item) notFound();

  const [schedule, maintenance, slots] = await Promise.all([
    equipmentSchedule(equipmentId),
    maintenanceFor(equipmentId),
    suggestSlots(equipmentId, new Date(), 21),
  ]);

  const events = schedule.map((s) => ({
    id: s.id,
    date: new Date(s.startAt),
    end: new Date(s.endAt),
    title: `${s.serviceType} · ${s.barangay ?? ""}`,
    tone: s.status,
    meta: s.farmer ?? "",
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-28">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/equipment" className="font-semibold text-emerald-700 hover:underline">
          ← Equipment &amp; Resources
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden !p-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} className="h-72 w-full object-cover" />
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={item.status} />
                <Badge value={item.condition} />
                <span className="text-xs font-semibold uppercase text-emerald-700">
                  {item.icon} {item.category}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">{item.name}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  ["Asset code", item.assetCode],
                  ["Home station", item.location],
                  ["Barangay", item.barangay ?? "—"],
                  ["Capacity", item.capacityNote || "—"],
                  ["Service rate", Number(item.ratePerHa) > 0 ? `${peso(item.ratePerHa)} / ha` : "Free / subsidised"],
                  ["Next maintenance", fmtDate(item.nextMaintenanceDue)],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{k}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/dashboard/requests/new?equipmentId=${item.id}`} className={btn.primary}>
                  📋 Request this unit
                </Link>
                <Link href="/schedule" className={btn.ghost}>
                  View municipal schedule
                </Link>
              </div>
            </div>
          </Card>

          <Card title="🗓️ Availability calendar" subtitle="Booked periods for this unit (this month)">
            <MonthCalendar month={startOfMonth(new Date())} events={events} />
            <div className="mt-4 rounded-xl bg-emerald-50/70 p-4">
              <p className="text-sm font-bold text-emerald-900">Next free service windows</p>
              {slots.length ? (
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {slots.map((s) => (
                    <li key={s.start.toISOString()} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                      ✅ {fmtRange(s.start, s.end)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-600">Fully booked for the next 3 weeks — you may join the waiting list.</p>
              )}
            </div>
          </Card>

          <Card title="🧰 Maintenance history" subtitle="Preventive and corrective service records">
            {maintenance.length ? (
              <TableShell head={["Date", "Type", "Description", "Cost", "Next due", "Status"]}>
                {maintenance.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-xs font-semibold">{fmtDate(m.serviceDate)}</td>
                    <td className="px-3 py-2 text-xs">{m.type}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{m.description}</td>
                    <td className="px-3 py-2 text-xs">{peso(m.cost)}</td>
                    <td className="px-3 py-2 text-xs">{fmtDate(m.nextDue)}</td>
                    <td className="px-3 py-2">
                      <Badge value={m.status} />
                    </td>
                  </tr>
                ))}
              </TableShell>
            ) : (
              <EmptyState icon="🧰" title="No maintenance recorded for this unit" />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="📍 Current location">
            {item.lat && item.lng ? (
              <MapView
                markers={[
                  {
                    id: `eq-${item.id}`,
                    lat: Number(item.lat),
                    lng: Number(item.lng),
                    title: item.name,
                    subtitle: item.assetCode,
                    detail: item.location,
                    emoji: "🚜",
                    tone: "equipment",
                  },
                ]}
                center={[Number(item.lat), Number(item.lng)]}
                zoom={13}
                height={260}
                showDirections
              />
            ) : (
              <EmptyState icon="🗺️" title="No coordinates recorded" />
            )}
          </Card>

          <Card title="📚 Usage & request history">
            <ul className="space-y-3">
              {schedule.slice(0, 8).map((s) => (
                <li key={s.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{s.serviceType}</p>
                    <Badge value={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{fmtRange(s.startAt, s.endAt)}</p>
                  <p className="text-xs text-slate-500">
                    {s.farmer ?? "—"} · Brgy. {s.barangay ?? "—"}
                  </p>
                </li>
              ))}
              {!schedule.length && <EmptyState icon="📭" title="No bookings yet for this unit" />}
            </ul>
          </Card>

          <Card title="🔖 QR identification (proposed)">
            <p className="text-xs text-slate-600">
              In a later implementation phase, each unit carries a QR code linking to this record for quick field
              identification and maintenance logging.
            </p>
            <div className="mt-3 grid grid-cols-8 gap-0.5 rounded-xl bg-white p-3 ring-1 ring-slate-200">
              {Array.from({ length: 64 }).map((_, i) => (
                <span
                  key={i}
                  className={`aspect-square ${(i * 7 + item.id * 3) % 3 === 0 ? "bg-slate-900" : "bg-white"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] font-mono text-slate-500">{item.assetCode}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
