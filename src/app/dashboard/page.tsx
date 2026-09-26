import Link from "next/link";
import { Badge, BarChart, Banner, Card, Donut, EmptyState, Stat, TableShell, btn } from "@/components/ui";
import {
  equipmentUtilization,
  farmersByBarangay,
  listAnnouncements,
  listAuditLogs,
  listEquipment,
  listFarms,
  listNotifications,
  listOperators,
  listRequests,
  listReservations,
  maintenanceFor,
  pendingConflicts,
  platformStats,
  requestsByBarangay,
  requestsByStatus,
  schedulingConflicts,
} from "@/lib/queries";
import { getCurrentUser, isMao, ROLE_LABELS } from "@/lib/session";
import { fmtDate, fmtRange, relative } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, announcements, notifications] = await Promise.all([
    platformStats(),
    listAnnouncements({ publicOnly: true }),
    listNotifications(user.id),
  ]);

  const greeting = `${new Date().getHours() < 12 ? "Magandang umaga" : new Date().getHours() < 18 ? "Magandang hapon" : "Magandang gabi"}, ${user.name.split(" ")[0]}!`;

  /* --------------------------- MAO dashboard --------------------------- */
  if (isMao(user.role) || user.role === "auditor") {
    const [requests, reservations, equipment, conflicts, pconf, byStatus, byBarangay, utilization, maintenance, logs, brgyFarmers] =
      await Promise.all([
        listRequests(),
        listReservations({ from: new Date() }),
        listEquipment(),
        schedulingConflicts(),
        pendingConflicts(),
        requestsByStatus(),
        requestsByBarangay(),
        equipmentUtilization(),
        maintenanceFor(),
        listAuditLogs(8),
        farmersByBarangay(),
      ]);

    const queue = requests.filter((r) => ["Submitted", "Under Review"].includes(r.status));
    const dueSoon = equipment.filter(
      (e) => e.nextMaintenanceDue && new Date(e.nextMaintenanceDue).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 21,
    );
    const statusCounts = ["Available", "Reserved", "In Use", "Under Maintenance"].map((s) => ({
      label: s,
      value: equipment.filter((e) => e.status === s).length,
    }));

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-emerald-900">{greeting}</h1>
            <p className="text-sm text-slate-500">
              {ROLE_LABELS[user.role]} · operational snapshot for {fmtDate(new Date())}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/requests" className={btn.primary}>
              📋 Review requests ({queue.length})
            </Link>
            <Link href="/dashboard/reports" className={btn.ghost}>
              📊 Reports
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Pending requests" value={stats.pending} icon="⏳" tone="amber" hint="Awaiting MAO decision" href="/dashboard/requests" />
          <Stat label="Approved / scheduled" value={stats.approved} icon="✅" hint={`${stats.upcoming} upcoming deployments`} href="/dashboard/harvester" />
          <Stat label="Equipment available" value={`${stats.availableCount}/${stats.equipmentCount}`} icon="🚜" tone="sky" hint={`${stats.maintenanceCount} under maintenance`} href="/dashboard/equipment" />
          <Stat label="Registered farmers" value={stats.farmerCount} icon="🧑‍🌾" hint={`${stats.assocCount} associations`} href="/dashboard/farmers" />
          <Stat label="Scheduling conflicts" value={conflicts.length + Object.keys(pconf).length} icon="⚠️" tone={conflicts.length ? "rose" : "slate"} hint="Overlaps detected" href="/dashboard/harvester" />
        </div>

        {(conflicts.length > 0 || Object.keys(pconf).length > 0) && (
          <Banner tone="warn" title="Scheduling conflicts need attention">
            <ul className="mt-1 list-disc pl-5">
              {conflicts.slice(0, 2).map((c, i) => (
                <li key={`c${i}`}>
                  {c.a.equipmentName}: confirmed booking {fmtRange(c.a.startAt, c.a.endAt)} overlaps {fmtRange(c.b.startAt, c.b.endAt)}
                </li>
              ))}
              {Object.entries(pconf)
                .slice(0, 2)
                .map(([id, items]) => (
                  <li key={id}>
                    Pending request {items[0].code} overlaps a confirmed reservation ({items[0].when})
                  </li>
                ))}
            </ul>
          </Banner>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title="📋 Request approval queue"
            subtitle="Oldest first — approve, reject or request a revision"
            action={
              <Link href="/dashboard/requests" className="text-sm font-semibold text-emerald-700 hover:underline">
                Open queue →
              </Link>
            }
          >
            {queue.length ? (
              <TableShell head={["Code", "Farmer", "Service", "Requested period", "Barangay", "Status"]}>
                {queue.slice(0, 6).map((r) => (
                  <tr key={r.id} className={pconf[r.id] ? "bg-rose-50" : ""}>
                    <td className="px-3 py-2 text-xs font-bold text-emerald-800">
                      <Link href={`/dashboard/requests/${r.id}`}>{r.code}</Link>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.farmerName}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.serviceType}
                      <span className="block text-[10px] text-slate-400">{r.equipmentName ?? r.resourceName}</span>
                    </td>
                    <td className="px-3 py-2 text-xs">{fmtRange(r.requestedStart, r.requestedEnd)}</td>
                    <td className="px-3 py-2 text-xs">{r.barangay}</td>
                    <td className="px-3 py-2">
                      <Badge value={pconf[r.id] ? "Conflict" : r.status} />
                    </td>
                  </tr>
                ))}
              </TableShell>
            ) : (
              <EmptyState icon="✅" title="No pending requests" hint="Every request has been acted upon." />
            )}
          </Card>

          <Card title="🚜 Equipment status">
            <Donut data={statusCounts} />
          </Card>

          <Card className="xl:col-span-2" title="🗓️ Upcoming deployments">
            {reservations.length ? (
              <ul className="divide-y divide-slate-100">
                {reservations.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {r.isHarvester ? "🌾" : "🚜"} {r.equipmentName} · {r.serviceType}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtRange(r.startAt, r.endAt)} · Brgy. {r.barangay ?? "—"} · Operator: {r.operatorName ?? "unassigned"}
                      </p>
                    </div>
                    <Badge value={r.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="🗓️" title="No upcoming deployments" />
            )}
          </Card>

          <Card title="🧰 Maintenance due soon">
            {dueSoon.length ? (
              <ul className="space-y-2">
                {dueSoon.map((e) => (
                  <li key={e.id} className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                    <p className="text-xs font-bold text-slate-800">{e.name}</p>
                    <p className="text-[11px] text-slate-600">Due {fmtDate(e.nextMaintenanceDue)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="🧰" title="Nothing due in the next 3 weeks" />
            )}
            <p className="mt-3 text-[11px] text-slate-500">{maintenance.length} maintenance records on file.</p>
          </Card>

          <Card title="📊 Requests by status">
            <BarChart data={byStatus.map((b) => ({ label: b.label, value: Number(b.value) }))} />
          </Card>
          <Card title="🏘️ Requests by barangay">
            <BarChart data={byBarangay.slice(0, 7).map((b) => ({ label: b.label ?? "—", value: Number(b.value) }))} />
          </Card>
          <Card title="⏱️ Equipment utilisation (hours)">
            <BarChart data={utilization.slice(0, 7)} unit="h" />
          </Card>

          <Card className="xl:col-span-2" title="🧾 Recent administrative activity">
            <ul className="divide-y divide-slate-100 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-slate-700">
                    <span className="font-semibold">{l.userName}</span> · {l.action} on {l.module}{" "}
                    <span className="text-slate-400">({l.recordId})</span>
                  </span>
                  <span className="text-xs text-slate-400">{relative(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="🧑‍🌾 Farmers by barangay">
            <BarChart data={brgyFarmers.slice(0, 7)} />
          </Card>
        </div>
      </div>
    );
  }

  /* -------------------------- operator dashboard ------------------------ */
  if (user.role === "operator") {
    const operators = await listOperators();
    const me = operators.find((o) => o.userId === user.id);
    const assignments = me ? await listReservations({ operatorId: me.id }) : [];
    const upcoming = assignments.filter((a) => new Date(a.endAt) >= new Date());

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-emerald-900">{greeting}</h1>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Upcoming jobs" value={upcoming.length} icon="🚚" />
          <Stat label="Completed jobs" value={assignments.filter((a) => a.status === "Completed").length} icon="✅" tone="sky" />
          <Stat label="Specialisation" value={me?.specialization ?? "—"} icon="🔧" tone="slate" />
        </div>
        <Card title="🚚 My field assignments" action={<Link href="/dashboard/assignments" className="text-sm font-semibold text-emerald-700">Open assignments →</Link>}>
          {upcoming.length ? (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      {a.equipmentName} · {a.serviceType}
                    </p>
                    <Badge value={a.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {fmtRange(a.startAt, a.endAt)} · {a.farmName ?? "—"}, Brgy. {a.barangay ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="🛻" title="No assignments scheduled" hint="New deployments will appear here once the MAO assigns you." />
          )}
        </Card>
      </div>
    );
  }

  /* --------------------------- farmer dashboard ------------------------- */
  const [myRequests, myReservations, myFarms] = await Promise.all([
    user.farmerId ? listRequests({ farmerId: user.farmerId }) : Promise.resolve([]),
    user.farmerId ? listReservations({ farmerId: user.farmerId }) : Promise.resolve([]),
    user.farmerId ? listFarms(user.farmerId) : Promise.resolve([]),
  ]);
  const upcoming = myReservations.filter((r) => new Date(r.endAt) >= new Date());
  const pending = myRequests.filter((r) => ["Submitted", "Under Review"].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">{greeting}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[user.role]} · {myFarms.length} registered farm(s)
          </p>
        </div>
        <Link href="/dashboard/requests/new" className={btn.primary}>
          ➕ Request equipment or resource
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="My pending requests" value={pending.length} icon="⏳" tone="amber" href="/dashboard/requests" />
        <Stat label="Approved / scheduled" value={myRequests.filter((r) => ["Approved", "In Progress"].includes(r.status)).length} icon="✅" href="/dashboard/requests" />
        <Stat label="Upcoming services" value={upcoming.length} icon="🗓️" tone="sky" href="/dashboard/harvester" />
        <Stat label="Completed services" value={myRequests.filter((r) => r.status === "Completed").length} icon="🏁" tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="📋 My latest requests" action={<Link href="/dashboard/requests" className="text-sm font-semibold text-emerald-700">View all →</Link>}>
          {myRequests.length ? (
            <TableShell head={["Code", "Service", "Equipment / resource", "Schedule", "Status"]}>
              {myRequests.slice(0, 6).map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-xs font-bold text-emerald-800">
                    <Link href={`/dashboard/requests/${r.id}`}>{r.code}</Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.serviceType}</td>
                  <td className="px-3 py-2 text-xs">{r.equipmentName ?? r.resourceName ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{fmtRange(r.requestedStart, r.requestedEnd)}</td>
                  <td className="px-3 py-2">
                    <Badge value={r.status} />
                  </td>
                </tr>
              ))}
            </TableShell>
          ) : (
            <EmptyState icon="📋" title="You have not submitted a request yet" hint="Use the Request Equipment button to book a harvester, tractor or farm input." />
          )}
        </Card>

        <Card title="🔔 My notifications" action={<Link href="/dashboard/notifications" className="text-sm font-semibold text-emerald-700">All →</Link>}>
          <ul className="space-y-3">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id} className={`rounded-xl border p-3 ${n.readAt ? "border-slate-200" : "border-emerald-300 bg-emerald-50/60"}`}>
                <p className="text-sm font-bold text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{relative(n.createdAt)}</p>
              </li>
            ))}
            {!notifications.length && <EmptyState icon="🔔" title="No notifications yet" />}
          </ul>
        </Card>

        <Card className="xl:col-span-2" title="🗓️ My upcoming service schedule">
          {upcoming.length ? (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {r.equipmentName} · {r.serviceType}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fmtRange(r.startAt, r.endAt)} · {r.farmName ?? "—"} · Operator: {r.operatorName ?? "to be assigned"}
                    </p>
                  </div>
                  <Badge value={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="🗓️" title="No confirmed schedule yet" hint="Approved requests automatically appear here." />
          )}
        </Card>

        <Card title="📢 Latest advisories">
          <ul className="space-y-3">
            {announcements.slice(0, 4).map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Badge value={a.priority} />
                  <span className="text-[10px] uppercase text-slate-400">{fmtDate(a.publishAt)}</span>
                </div>
                <Link href={`/announcements?id=${a.id}`} className="mt-1 block text-sm font-bold text-slate-800 hover:text-emerald-700">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
