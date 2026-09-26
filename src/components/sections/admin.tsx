import Link from "next/link";
import { Badge, BarChart, Card, Disclosure, Donut, EmptyState, Field, Stat, TableShell, TrendChart, btn, inputClass } from "@/components/ui";
import { ConfirmSubmit, PasswordForm } from "@/components/forms";
import MapView from "@/components/map-view";
import type { MapMarker } from "@/components/leaflet-map";
import {
  equipmentUtilization,
  farmersByBarangay,
  getFarmerByUser,
  getSettings,
  listAnnouncements,
  listAssociations,
  listAuditLogs,
  listBarangays,
  listEquipment,
  listFarmers,
  listFarms,
  listMarketPrices,
  listMeetings,
  listNotifications,
  listPrograms,
  listApplications,
  listRequests,
  listReservations,
  listUsers,
  maintenanceFor,
  meetingAttendees,
  monthlyRequestTrend,
  platformStats,
  requestsByBarangay,
  requestsByEquipment,
  requestsByStatus,
  schedulingConflicts,
} from "@/lib/queries";
import {
  deleteFarmAction,
  markNotificationAction,
  saveFarmAction,
  saveMarketPriceAction,
  saveUserAction,
  toggleUserStatusAction,
  updateProfileAction,
  updateSettingsAction,
} from "@/lib/actions";
import { isMao, ROLE_LABELS, type SessionUser } from "@/lib/session";
import { fmtDate, fmtDateTime, fmtRange, peso, relative, toDateInput } from "@/lib/utils";

type SP = Record<string, string | undefined>;

/* ------------------------------ profile ------------------------------ */

export async function ProfileSection({ user }: { user: SessionUser }) {
  const [barangays, associations, farmer, farms] = await Promise.all([
    listBarangays(),
    listAssociations(),
    getFarmerByUser(user.id),
    user.farmerId ? listFarms(user.farmerId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">My Profile</h1>
        <p className="text-sm text-slate-500">{ROLE_LABELS[user.role]} · AgriShare account settings</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="👤 Personal information">
          <form action={updateProfileAction} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <input name="name" defaultValue={user.name} className={inputClass} />
            </Field>
            <Field label="Mobile number">
              <input name="phone" defaultValue={user.phone} className={inputClass} />
            </Field>
            <Field label="Email (login)">
              <input value={user.email} disabled className={`${inputClass} bg-slate-100`} />
            </Field>
            <Field label="Barangay">
              <select name="barangayId" defaultValue={user.barangayId ?? ""} className={inputClass}>
                <option value="">Select…</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            {user.farmerId && (
              <>
                <Field label="RSBSA number">
                  <input name="rsbsaNumber" defaultValue={farmer?.rsbsaNumber} className={inputClass} />
                </Field>
                <Field label="Association">
                  <select name="associationId" defaultValue={farmer?.associationId ?? ""} className={inputClass}>
                    <option value="">None</option>
                    {associations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Main crop">
                  <input name="mainCrop" defaultValue={farmer?.mainCrop} className={inputClass} />
                </Field>
                <Field label="Total farm area (ha)">
                  <input name="totalAreaHa" type="number" step="0.01" defaultValue={farmer?.totalAreaHa} className={inputClass} />
                </Field>
                <Field label="Preferred contact">
                  <select name="preferredContact" defaultValue={farmer?.preferredContact} className={inputClass}>
                    {["Mobile", "SMS", "Email", "Barangay Office"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Complete address">
                  <input name="address" defaultValue={farmer?.address} className={inputClass} />
                </Field>
              </>
            )}
            <div className="sm:col-span-2">
              <button className={btn.primary}>Save profile</button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="🔐 Change password">
            <PasswordForm />
          </Card>
          <Card title="📇 Account summary">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-slate-800">Role:</span> {ROLE_LABELS[user.role]}
              </li>
              <li>
                <span className="font-semibold text-slate-800">Status:</span> <Badge value={user.status} />
              </li>
              <li>
                <span className="font-semibold text-slate-800">Registered farms:</span> {farms.length}
              </li>
              <li>
                <span className="font-semibold text-slate-800">Barangay:</span> {farmer?.barangay ?? "—"}
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- farms ------------------------------- */

export async function FarmsSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const [farms, barangays] = await Promise.all([
    mao ? listFarms() : listFarms(user.farmerId ?? -1),
    listBarangays(),
  ]);

  const markers: MapMarker[] = farms.map((f) => ({
    id: `f-${f.id}`,
    lat: Number(f.lat),
    lng: Number(f.lng),
    title: f.name,
    subtitle: `${f.crop} · ${f.areaHa} ha`,
    detail: `Brgy. ${f.barangay ?? "—"} · ${f.landmark}`,
    emoji: "🌱",
    tone: "farm",
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">{mao ? "Registered Farms" : "My Farms"}</h1>
        <p className="text-sm text-slate-500">Farm plots used as service destinations for equipment requests.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {farms.map((f) => (
            <Card key={f.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">🌱 {f.name}</h2>
                  <p className="text-xs text-slate-500">
                    {f.crop} · {f.areaHa} ha · Brgy. {f.barangay ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">📍 {f.landmark}</p>
                  <p className="text-[10px] text-slate-400">
                    {f.lat}, {f.lng} {mao && f.owner ? `· Owner: ${f.owner}` : ""}
                  </p>
                  {f.notes && <p className="mt-1 text-xs italic text-slate-500">{f.notes}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Disclosure summary="Edit" tone="ghost">
                    <form action={saveFarmAction} className="grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="farmerId" value={f.farmerId} />
                      <Field label="Farm name">
                        <input name="name" defaultValue={f.name} className={inputClass} />
                      </Field>
                      <Field label="Crop">
                        <input name="crop" defaultValue={f.crop} className={inputClass} />
                      </Field>
                      <Field label="Area (ha)">
                        <input name="areaHa" type="number" step="0.01" defaultValue={f.areaHa} className={inputClass} />
                      </Field>
                      <Field label="Barangay">
                        <select name="barangayId" defaultValue={f.barangayId ?? ""} className={inputClass}>
                          {barangays.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Latitude">
                        <input name="lat" defaultValue={f.lat} className={inputClass} />
                      </Field>
                      <Field label="Longitude">
                        <input name="lng" defaultValue={f.lng} className={inputClass} />
                      </Field>
                      <Field label="Landmark" className="sm:col-span-2">
                        <input name="landmark" defaultValue={f.landmark} className={inputClass} />
                      </Field>
                      <div className="sm:col-span-2">
                        <button className={btn.primary}>Save farm</button>
                      </div>
                    </form>
                  </Disclosure>
                  <form action={deleteFarmAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <ConfirmSubmit label="Delete" message="Delete this farm record?" />
                  </form>
                </div>
              </div>
            </Card>
          ))}
          {!farms.length && <EmptyState icon="🌱" title="No farm registered yet" hint="Add your farm so the MAO can map your service destination." />}

          <Card title="➕ Register a new farm">
            <form action={saveFarmAction} className="grid gap-3 sm:grid-cols-2">
              <Field label="Farm name">
                <input name="name" required className={inputClass} placeholder="Dela Cruz Rice Field C" />
              </Field>
              <Field label="Crop">
                <input name="crop" defaultValue="Rice" className={inputClass} />
              </Field>
              <Field label="Area (ha)">
                <input name="areaHa" type="number" step="0.01" defaultValue="1.00" className={inputClass} />
              </Field>
              <Field label="Barangay">
                <select name="barangayId" className={inputClass} defaultValue={user.barangayId ?? ""}>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Latitude" hint="Tip: long-press your location in Google Maps to copy coordinates.">
                <input name="lat" defaultValue="13.357800" className={inputClass} />
              </Field>
              <Field label="Longitude">
                <input name="lng" defaultValue="121.100200" className={inputClass} />
              </Field>
              <Field label="Landmark" className="sm:col-span-2">
                <input name="landmark" className={inputClass} placeholder="Near the irrigation canal" />
              </Field>
              <div className="sm:col-span-2">
                <button className={btn.primary}>Add farm</button>
              </div>
            </form>
          </Card>
        </div>

        <Card title="🗺️ Farm locations">
          <MapView markers={markers} height={460} showDirections />
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------- notifications --------------------------- */

export async function NotificationsSection({ user }: { user: SessionUser }) {
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.readAt);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">Notification Center</h1>
          <p className="text-sm text-slate-500">{unread.length} unread of {notifications.length} notifications</p>
        </div>
        <form action={markNotificationAction}>
          <button className={btn.ghost}>Mark all as read</button>
        </form>
      </header>

      {notifications.length ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.readAt ? "" : "border-emerald-400"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge value={n.type} />
                    {!n.readAt && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                    <span className="text-[11px] text-slate-400">{relative(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.message}</p>
                </div>
                <div className="flex gap-2">
                  {n.link && (
                    <Link href={n.link} className={btn.smallGhost}>
                      Open
                    </Link>
                  )}
                  {!n.readAt && (
                    <form action={markNotificationAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button className={btn.small}>Mark read</button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="🔔" title="No notifications yet" hint="Approvals, schedules and advisories will appear here." />
      )}
    </div>
  );
}

/* --------------------------------- map -------------------------------- */

export async function DashboardMapSection({ user, sp }: { user: SessionUser; sp: SP }) {
  const mao = isMao(user.role);
  const [farms, equipment, reservations, barangays] = await Promise.all([
    mao ? listFarms() : listFarms(user.farmerId ?? -1),
    listEquipment(),
    listReservations({ from: new Date(new Date().setDate(new Date().getDate() - 30)) }),
    listBarangays(),
  ]);
  const layer = sp.layer ?? "all";
  const markers: MapMarker[] = [];

  if (layer === "all" || layer === "farms")
    farms.forEach((f) =>
      markers.push({
        id: `f-${f.id}`,
        lat: Number(f.lat),
        lng: Number(f.lng),
        title: f.name,
        subtitle: `${f.crop} · ${f.areaHa} ha`,
        detail: `${mao && f.owner ? `${f.owner} · ` : ""}Brgy. ${f.barangay ?? "—"}`,
        emoji: "🌱",
        tone: "farm",
      }),
    );

  if (layer === "all" || layer === "equipment")
    equipment.forEach(
      (e) =>
        e.lat &&
        e.lng &&
        markers.push({
          id: `e-${e.id}`,
          lat: Number(e.lat),
          lng: Number(e.lng),
          title: e.name,
          subtitle: `${e.assetCode} · ${e.status}`,
          detail: e.location,
          emoji: e.icon ?? "🚜",
          tone: "equipment",
        }),
    );

  if (layer === "all" || layer === "services")
    reservations.forEach(
      (r) =>
        r.farmLat &&
        r.farmLng &&
        markers.push({
          id: `r-${r.id}`,
          lat: Number(r.farmLat),
          lng: Number(r.farmLng),
          title: `${r.serviceType} — ${r.status}`,
          subtitle: r.equipmentName ?? "",
          detail: `${fmtRange(r.startAt, r.endAt)} · Brgy. ${r.barangay ?? "—"}`,
          emoji: "📌",
          tone: "service",
        }),
    );

  if (layer === "barangays")
    barangays.forEach((b) =>
      markers.push({
        id: `b-${b.id}`,
        lat: Number(b.lat),
        lng: Number(b.lng),
        title: `Barangay ${b.name}`,
        subtitle: `${b.farmlandHa} ha farmland`,
        emoji: "🏘️",
        tone: "office",
      }),
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">Farm &amp; Service Map</h1>
          <p className="text-sm text-slate-500">Operational GIS view with farm plots, equipment stations and service destinations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["farms", "Farms"],
            ["equipment", "Equipment"],
            ["services", "Service destinations"],
            ["barangays", "Barangays"],
          ].map(([v, l]) => (
            <Link key={v} href={`/dashboard/map?layer=${v}`} className={layer === v ? btn.small : btn.smallGhost}>
              {l}
            </Link>
          ))}
        </div>
      </header>
      <Card className="!p-3">
        <MapView markers={markers} height={560} showDirections />
      </Card>
      <p className="text-xs text-slate-500">
        {markers.length} marker(s) rendered · Leaflet + OpenStreetMap · Directions open in Google Maps for the assigned
        driver or technician.
      </p>
    </div>
  );
}

/* ------------------------------- market -------------------------------- */

export async function MarketSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const prices = await listMarketPrices();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Market Data</h1>
        <p className="text-sm text-slate-500">Commodity price monitoring maintained by MAO market monitors.</p>
      </header>

      {mao && (
        <Card title="➕ Record a price update">
          <form action={saveMarketPriceAction} className="grid gap-3 sm:grid-cols-3">
            <Field label="Commodity">
              <input name="crop" required className={inputClass} />
            </Field>
            <Field label="Category">
              <select name="category" className={inputClass} defaultValue="Cereal">
                {["Cereal", "Vegetable", "Fruit", "Plantation", "Livestock"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Market">
              <input name="market" defaultValue="Baco Public Market" className={inputClass} />
            </Field>
            <Field label="Unit">
              <input name="unit" defaultValue="kg" className={inputClass} />
            </Field>
            <Field label="Price (₱)">
              <input name="price" type="number" step="0.01" required className={inputClass} />
            </Field>
            <Field label="Previous price (₱)">
              <input name="previousPrice" type="number" step="0.01" defaultValue="0" className={inputClass} />
            </Field>
            <Field label="Price date">
              <input type="date" name="priceDate" defaultValue={toDateInput(new Date())} className={inputClass} />
            </Field>
            <Field label="Source">
              <input name="source" defaultValue="MAO Baco Market Monitoring" className={inputClass} />
            </Field>
            <div className="sm:col-span-3">
              <button className={btn.primary}>Save price</button>
            </div>
          </form>
        </Card>
      )}

      <Card title="💹 Monitored prices">
        <TableShell head={["Commodity", "Category", "Market", "Unit", "Price", "Previous", "Date", "Source"]}>
          {prices.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2 text-xs font-bold text-slate-800">{p.crop}</td>
              <td className="px-3 py-2 text-xs">{p.category}</td>
              <td className="px-3 py-2 text-xs">{p.market}</td>
              <td className="px-3 py-2 text-xs">{p.unit}</td>
              <td className="px-3 py-2 text-xs font-bold text-emerald-700">{peso(p.price)}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{peso(p.previousPrice)}</td>
              <td className="px-3 py-2 text-xs">{fmtDate(p.priceDate)}</td>
              <td className="px-3 py-2 text-[10px] text-slate-400">{p.source}</td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}

/* ------------------------------- reports ------------------------------- */

export async function ReportsSection({ sp }: { sp: SP }) {
  const [
    stats,
    equipment,
    requests,
    reservations,
    byBarangay,
    byEquipment,
    byStatus,
    trend,
    utilization,
    brgyFarmers,
    maintenance,
    conflicts,
    meetings,
    attendees,
    announcements,
    programs,
    applications,
    farmers,
  ] = await Promise.all([
    platformStats(),
    listEquipment(),
    listRequests(),
    listReservations(),
    requestsByBarangay(),
    requestsByEquipment(),
    requestsByStatus(),
    monthlyRequestTrend(),
    equipmentUtilization(),
    farmersByBarangay(),
    maintenanceFor(),
    schedulingConflicts(),
    listMeetings(),
    meetingAttendees(),
    listAnnouncements(),
    listPrograms(),
    listApplications(),
    listFarmers(),
  ]);

  const from = sp.from ? new Date(sp.from) : null;
  const to = sp.to ? new Date(sp.to) : null;
  const inRange = requests.filter((r) => {
    const d = new Date(r.createdAt);
    return (!from || d >= from) && (!to || d <= to);
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500">Administrative monitoring for MAO Baco · generated {fmtDateTime(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/export?type=requests" className={btn.ghost}>
            ⬇️ Requests CSV
          </a>
          <a href="/api/export?type=equipment" className={btn.ghost}>
            ⬇️ Inventory CSV
          </a>
          <a href="/api/export?type=schedule" className={btn.ghost}>
            ⬇️ Schedule CSV
          </a>
          <a href="/api/export?type=farmers" className={btn.ghost}>
            ⬇️ Farmers CSV
          </a>
        </div>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <Field label="From">
          <input type="date" name="from" defaultValue={sp.from ?? ""} className={inputClass} />
        </Field>
        <Field label="To">
          <input type="date" name="to" defaultValue={sp.to ?? ""} className={inputClass} />
        </Field>
        <button className={btn.primary}>Apply date range</button>
        <Link href="/dashboard/reports" className={btn.ghost}>
          Reset
        </Link>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Requests (range)" value={inRange.length} icon="📋" />
        <Stat label="Completed" value={requests.filter((r) => r.status === "Completed").length} icon="🏁" />
        <Stat label="Rejected" value={requests.filter((r) => r.status === "Rejected").length} icon="⛔" tone="rose" />
        <Stat label="Cancelled" value={requests.filter((r) => r.status === "Cancelled").length} icon="🚫" tone="amber" />
        <Stat label="Reservations" value={reservations.length} icon="🗓️" tone="sky" />
        <Stat label="Conflicts" value={conflicts.length} icon="⚠️" tone={conflicts.length ? "rose" : "slate"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="📈 Monthly request trend">
          <TrendChart data={trend} />
        </Card>
        <Card title="🥧 Requests by status">
          <Donut data={byStatus.map((b) => ({ label: b.label, value: Number(b.value) }))} />
        </Card>
        <Card title="🏘️ Requests by barangay">
          <BarChart data={byBarangay.map((b) => ({ label: b.label ?? "—", value: Number(b.value) }))} />
        </Card>
        <Card title="🚜 Requests by equipment type">
          <BarChart data={byEquipment.map((b) => ({ label: b.label, value: Number(b.value) }))} />
        </Card>
        <Card title="⏱️ Equipment utilisation (hours booked)">
          <BarChart data={utilization} unit="h" />
        </Card>
        <Card title="🧑‍🌾 Farmer registration by barangay">
          <BarChart data={brgyFarmers} />
        </Card>
      </div>

      <Card title="📦 Equipment inventory & availability report">
        <TableShell head={["Asset", "Category", "Status", "Condition", "Station", "Bookings", "Next maintenance"]}>
          {equipment.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2 text-xs font-bold">{e.name}</td>
              <td className="px-3 py-2 text-xs">{e.category}</td>
              <td className="px-3 py-2">
                <Badge value={e.status} />
              </td>
              <td className="px-3 py-2 text-xs">{e.condition}</td>
              <td className="px-3 py-2 text-xs">{e.location}</td>
              <td className="px-3 py-2 text-xs">{reservations.filter((r) => r.equipmentId === e.id).length}</td>
              <td className="px-3 py-2 text-xs">{fmtDate(e.nextMaintenanceDue)}</td>
            </tr>
          ))}
        </TableShell>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="🌾 Harvester schedule report">
          <TableShell head={["Schedule", "Unit", "Barangay", "Operator", "Status"]}>
            {reservations
              .filter((r) => r.isHarvester)
              .map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-xs">{fmtRange(r.startAt, r.endAt)}</td>
                  <td className="px-3 py-2 text-xs">{r.assetCode}</td>
                  <td className="px-3 py-2 text-xs">{r.barangay ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.operatorName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge value={r.status} />
                  </td>
                </tr>
              ))}
          </TableShell>
        </Card>

        <Card title="🧰 Maintenance due report">
          <TableShell head={["Unit", "Last service", "Type", "Next due", "Status"]}>
            {maintenance.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2 text-xs">{m.equipmentName}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(m.serviceDate)}</td>
                <td className="px-3 py-2 text-xs">{m.type}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(m.nextDue)}</td>
                <td className="px-3 py-2">
                  <Badge value={m.status} />
                </td>
              </tr>
            ))}
          </TableShell>
        </Card>

        <Card title="👥 Meeting attendance report">
          <TableShell head={["Meeting", "Date", "Invited", "Confirmed", "Attended"]}>
            {meetings.map((m) => {
              const list = attendees.filter((a) => a.meetingId === m.id);
              return (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-xs">{m.title}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(m.startAt)}</td>
                  <td className="px-3 py-2 text-xs">{list.length}</td>
                  <td className="px-3 py-2 text-xs">{list.filter((a) => a.status === "Confirmed").length}</td>
                  <td className="px-3 py-2 text-xs">{list.filter((a) => a.status === "Attended").length}</td>
                </tr>
              );
            })}
          </TableShell>
        </Card>

        <Card title="🎁 Programme participation report">
          <TableShell head={["Programme", "Slots", "Applications", "Approved", "Status"]}>
            {programs.map((p) => {
              const apps = applications.filter((a) => a.programId === p.id);
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-xs">{p.title}</td>
                  <td className="px-3 py-2 text-xs">{p.slots}</td>
                  <td className="px-3 py-2 text-xs">{apps.length}</td>
                  <td className="px-3 py-2 text-xs">{apps.filter((a) => a.status === "Approved").length}</td>
                  <td className="px-3 py-2">
                    <Badge value={p.status} />
                  </td>
                </tr>
              );
            })}
          </TableShell>
        </Card>
      </div>

      <Card title="🗒️ Monthly MAO activity summary">
        <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
          <li>📋 Requests filed: <strong>{requests.length}</strong></li>
          <li>✅ Approved: <strong>{requests.filter((r) => r.status === "Approved").length}</strong></li>
          <li>🏁 Completed services: <strong>{requests.filter((r) => r.status === "Completed").length}</strong></li>
          <li>🚜 Equipment units: <strong>{stats.equipmentCount}</strong></li>
          <li>🧑‍🌾 Registered farmers: <strong>{farmers.length}</strong></li>
          <li>📢 Announcements published: <strong>{announcements.filter((a) => a.status === "Published").length}</strong></li>
          <li>👥 Meetings conducted: <strong>{meetings.filter((m) => m.status === "Completed").length}</strong></li>
          <li>⚠️ Scheduling conflicts: <strong>{conflicts.length}</strong></li>
          <li>🧰 Maintenance records: <strong>{maintenance.length}</strong></li>
        </ul>
      </Card>
    </div>
  );
}

/* ---------------------------- user management -------------------------- */

export async function UsersSection({ user }: { user: SessionUser }) {
  const [users, barangays] = await Promise.all([listUsers(), listBarangays()]);
  const roles = Object.keys(ROLE_LABELS);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Users &amp; Role Management</h1>
        <p className="text-sm text-slate-500">Role-based access control for MAO personnel, farmers and partners.</p>
      </header>

      <Card title="➕ Create account">
        <Disclosure summary="Open account form">
          <form action={saveUserAction} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" required className={inputClass} />
            </Field>
            <Field label="Mobile">
              <input name="phone" className={inputClass} />
            </Field>
            <Field label="Role">
              <select name="role" className={inputClass} defaultValue="farmer">
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r as keyof typeof ROLE_LABELS]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Barangay">
              <select name="barangayId" className={inputClass} defaultValue="">
                <option value="">—</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Temporary password" hint="Default: agrishare123">
              <input name="password" defaultValue="agrishare123" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <button className={btn.primary}>Create account</button>
            </div>
          </form>
        </Disclosure>
      </Card>

      <Card title="🛡️ Accounts">
        <TableShell head={["User", "Role", "Barangay", "Status", "Created", "Actions"]}>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-3 py-2">
                <span className="text-xs font-bold text-slate-800">
                  {u.avatarEmoji} {u.name}
                </span>
                <span className="block text-[10px] text-slate-400">{u.email}</span>
              </td>
              <td className="px-3 py-2 text-xs">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</td>
              <td className="px-3 py-2 text-xs">{u.barangay ?? "—"}</td>
              <td className="px-3 py-2">
                <Badge value={u.status} />
              </td>
              <td className="px-3 py-2 text-xs">{fmtDate(u.createdAt)}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  <Disclosure summary="Edit" tone="ghost">
                    <form action={saveUserAction} className="grid gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <Field label="Name">
                        <input name="name" defaultValue={u.name} className={inputClass} />
                      </Field>
                      <Field label="Email">
                        <input name="email" defaultValue={u.email} className={inputClass} />
                      </Field>
                      <Field label="Phone">
                        <input name="phone" defaultValue={u.phone} className={inputClass} />
                      </Field>
                      <Field label="Role">
                        <select name="role" defaultValue={u.role} className={inputClass}>
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r as keyof typeof ROLE_LABELS]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Status">
                        <select name="status" defaultValue={u.status} className={inputClass}>
                          {["Active", "Deactivated"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <button className={btn.small}>Save</button>
                    </form>
                  </Disclosure>
                  {u.id !== user.id && (
                    <form action={toggleUserStatusAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <ConfirmSubmit
                        label={u.status === "Active" ? "Deactivate" : "Activate"}
                        message={`${u.status === "Active" ? "Deactivate" : "Activate"} ${u.name}?`}
                        className={btn.smallGhost}
                      />
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>

      <Card title="🔑 Role permissions matrix">
        <TableShell head={["Role", "Requests", "Scheduling", "Inventory", "Content", "Farmers", "Admin"]}>
          {[
            ["MAO Administrator", "Full", "Full", "Full", "Full", "Full", "Full"],
            ["MAO Staff", "Approve/Reject", "Manage", "Manage", "Publish", "View/Edit", "—"],
            ["Farmer", "Create/Cancel own", "View own", "View catalog", "Read", "Own profile", "—"],
            ["Association Officer", "Create for members", "View", "View catalog", "Read", "Members", "—"],
            ["Barangay Rep.", "View barangay", "View barangay", "View catalog", "Read", "Barangay", "—"],
            ["Driver / Operator", "—", "Update job status", "Log maintenance", "Read", "—", "—"],
            ["System Auditor", "Read-only", "Read-only", "Read-only", "Read-only", "Read-only", "Logs"],
          ].map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className={`px-3 py-2 text-xs ${i === 0 ? "font-bold text-slate-800" : "text-slate-600"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}

/* ------------------------------ audit logs ----------------------------- */

export async function AuditLogsSection({ sp }: { sp: SP }) {
  const logs = await listAuditLogs(200);
  const q = sp.q?.toLowerCase();
  const filtered = q
    ? logs.filter((l) => `${l.userName} ${l.action} ${l.module} ${l.recordId} ${l.details}`.toLowerCase().includes(q))
    : logs;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">Immutable-style record of administrative actions for accountability.</p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <Field label="Search logs" className="grow">
          <input name="q" defaultValue={sp.q ?? ""} className={inputClass} placeholder="user, action, module or record" />
        </Field>
        <button className={btn.primary}>Search</button>
        <Link href="/dashboard/audit-logs" className={btn.ghost}>
          Reset
        </Link>
      </form>

      <Card title={`🧾 ${filtered.length} log entries`}>
        <TableShell head={["Timestamp", "User", "Action", "Module", "Record", "Details"]}>
          {filtered.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2 text-xs text-slate-500">{fmtDateTime(l.createdAt)}</td>
              <td className="px-3 py-2 text-xs font-semibold">{l.userName}</td>
              <td className="px-3 py-2">
                <Badge value={l.action} />
              </td>
              <td className="px-3 py-2 text-xs">{l.module}</td>
              <td className="px-3 py-2 text-[10px] text-slate-400">{l.recordId}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{l.details}</td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}

/* ------------------------------- settings ------------------------------ */

export async function SettingsSection() {
  const [settings, categories] = await Promise.all([getSettings(), listEquipment()]);
  const groups = Array.from(new Set(settings.map((s) => s.group)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">System Settings</h1>
        <p className="text-sm text-slate-500">Office information, scheduling policy and integration configuration.</p>
      </header>

      <form action={updateSettingsAction} className="space-y-6">
        {groups.map((g) => (
          <Card key={g} title={`⚙️ ${g}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {settings
                .filter((s) => s.group === g)
                .map((s) => (
                  <Field key={s.key} label={s.label} hint={`key: ${s.key}`}>
                    <input name={`setting_${s.key}`} defaultValue={s.value} className={inputClass} />
                  </Field>
                ))}
            </div>
          </Card>
        ))}
        <button className={btn.primary}>Save all settings</button>
      </form>

      <Card title="🐬 MySQL / phpMyAdmin Integration">
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            AgriShare includes a complete <strong>MySQL / phpMyAdmin</strong> database dump with all 26 tables,
            foreign keys, and seed data.
          </p>
          <div className="rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-700">
            <p className="font-bold text-slate-900"># XAMPP / phpMyAdmin Connection (.env)</p>
            <p>DATABASE_URL=mysql://root:@127.0.0.1:3306/agrishare_db</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/mysql-dump"
              download="agrishare_mysql_phpmyadmin.sql"
              className={btn.primary}
            >
              ⬇️ Download phpMyAdmin MySQL Dump (.sql)
            </a>
            <a
              href="/agrishare-source.zip"
              download
              className={btn.ghost}
            >
              📦 Download Full Project ZIP
            </a>
          </div>
        </div>
      </Card>

      <Card title="🧩 Platform information">
        <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <li>Framework: Next.js (App Router) + React server components</li>
          <li>Database options: MySQL (phpMyAdmin) &amp; PostgreSQL</li>
          <li>Mapping: Leaflet + OpenStreetMap</li>
          <li>Weather: Open-Meteo REST API with server-side caching</li>
          <li>Security: scrypt password hashing, signed HTTP-only session cookies, RBAC</li>
          <li>Inventory records loaded: {categories.length} equipment units</li>
        </ul>
      </Card>
    </div>
  );
}
