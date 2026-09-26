import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Banner, Card, EmptyState, Stat, btn } from "@/components/ui";
import { RequestForm } from "@/components/forms";
import { FarmerDetailSection } from "@/components/sections/community";
import MapView from "@/components/map-view";
import { getCurrentUser, isMao } from "@/lib/session";
import {
  getRequest,
  listBarangays,
  listEquipment,
  listFarms,
  listResources,
  listReservations,
  pendingRequestConflicts,
  reservationConflicts,
  settingsMap,
} from "@/lib/queries";
import { fmtDate, fmtDateTime, fmtRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardDetail({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { section, id } = await params;
  const rawSp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  /* ------------------------- new request form ------------------------- */
  if (section === "requests" && id === "new") {
    if (!user.farmerId) {
      return (
        <Card title="Farmer account required">
          <EmptyState
            icon="🧑‍🌾"
            title="Only farmer, association and barangay accounts can file requests"
            hint="MAO personnel create reservations directly from the approval queue and the scheduling module."
          />
          <div className="mt-4 flex gap-2">
            <Link href="/dashboard/requests" className={btn.primary}>
              Open the request queue
            </Link>
          </div>
        </Card>
      );
    }
    const [equipment, resources, farms, barangays, cfg] = await Promise.all([
      listEquipment(),
      listResources(),
      listFarms(user.farmerId),
      listBarangays(),
      settingsMap(),
    ]);
    const preselect = rawSp.equipmentId ? Number(Array.isArray(rawSp.equipmentId) ? rawSp.equipmentId[0] : rawSp.equipmentId) : undefined;

    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-emerald-900">Request Equipment or Shared Resource</h1>
          <p className="text-sm text-slate-500">
            Minimum lead time: {cfg.request_lead_days} days · maximum booking duration: {cfg.max_booking_hours} hours ·
            automatic conflict detection: {cfg.conflict_detection}
          </p>
        </header>

        <Banner tone="info" title="How this works">
          Choose the unit and your preferred service period, then use <strong>Check availability</strong> to validate the
          schedule before submitting. Conflicting periods are rejected automatically and alternative windows are
          suggested. Your request then enters the MAO review queue.
        </Banner>

        <Card>
          <RequestForm
            equipment={equipment.map((e) => ({ id: e.id, label: `${e.name} (${e.assetCode})`, status: e.status, extra: e.category ?? undefined }))}
            resources={resources.map((r) => ({ id: r.id, label: r.name, extra: `${r.quantityAvailable} ${r.unit} available` }))}
            farms={farms.map((f) => ({
              id: f.id,
              label: f.name,
              barangayId: f.barangayId,
              crop: f.crop,
              area: String(f.areaHa),
            }))}
            barangays={barangays.map((b) => ({ id: b.id, label: b.name }))}
            defaultEquipmentId={preselect}
          />
        </Card>

        {!farms.length && (
          <Banner tone="warn" title="No farm registered yet">
            Add your farm first so the MAO can map the service destination.{" "}
            <Link href="/dashboard/farms" className="font-semibold underline">
              Register a farm
            </Link>
          </Banner>
        )}
      </div>
    );
  }

  /* --------------------------- request detail -------------------------- */
  if (section === "requests") {
    const request = await getRequest(Number(id));
    if (!request) notFound();
    if (!isMao(user.role) && user.role !== "auditor" && request.farmerId !== user.farmerId) {
      return <EmptyState icon="🔒" title="You are not authorised to view this request" />;
    }
    const [reservations, clashes, pendingClashes] = await Promise.all([
      listReservations({}),
      request.equipmentId
        ? reservationConflicts(request.equipmentId, new Date(request.requestedStart), new Date(request.requestedEnd))
        : Promise.resolve([]),
      request.equipmentId
        ? pendingRequestConflicts(request.equipmentId, new Date(request.requestedStart), new Date(request.requestedEnd), request.id)
        : Promise.resolve([]),
    ]);
    const reservation = reservations.find((r) => r.requestId === request.id);

    const timeline = [
      { label: "Submitted", at: request.createdAt, done: true },
      { label: "Reviewed by MAO", at: request.reviewedAt, done: Boolean(request.reviewedAt) },
      { label: "Scheduled", at: reservation?.startAt ?? null, done: Boolean(reservation) },
      { label: "In progress", at: reservation?.status === "In Progress" ? reservation.startAt : null, done: ["In Progress", "Completed"].includes(request.status) },
      { label: "Completed", at: request.completedAt, done: request.status === "Completed" },
    ];

    return (
      <div className="space-y-6">
        <Link href="/dashboard/requests" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← Back to requests
        </Link>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-emerald-900">{request.code}</h1>
                <Badge value={request.status} />
                <Badge value={request.priority} />
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {request.serviceType} · {request.equipmentName ?? request.resourceName}
              </p>
              <p className="text-xs text-slate-500">
                Filed {fmtDateTime(request.createdAt)} by {request.farmerName}
                {isMao(user.role) && request.farmerPhone ? ` · ${request.farmerPhone}` : ""}
              </p>
            </div>
            {isMao(user.role) && (
              <Link href="/dashboard/requests" className={btn.primary}>
                Open review queue
              </Link>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Requested period" value={fmtDate(request.requestedStart)} hint={fmtRange(request.requestedStart, request.requestedEnd)} icon="🗓️" />
            <Stat label="Location" value={request.barangay ?? "—"} hint={request.farmName ?? "No farm linked"} icon="📍" tone="sky" />
            <Stat label="Crop / area" value={`${request.areaHa} ha`} hint={request.cropType} icon="🌾" tone="slate" />
            <Stat label="Assigned operator" value={reservation?.operatorName ?? "—"} hint={reservation ? `Reservation #${reservation.id}` : "Not yet scheduled"} icon="👷" tone="amber" />
          </div>

          {request.purpose && (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-bold">Purpose: </span>
              {request.purpose}
            </p>
          )}
          {request.notes && <p className="mt-2 text-xs text-slate-500">Notes: {request.notes}</p>}
          {request.attachmentName && <p className="mt-2 text-xs text-slate-500">📎 {request.attachmentName}</p>}
          {request.reviewNotes && (
            <p className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <span className="font-bold">MAO remarks: </span>
              {request.reviewNotes}
            </p>
          )}
        </Card>

        {(clashes.length > 0 || pendingClashes.length > 0) && (
          <Banner tone="warn" title="Conflicting bookings detected for this period">
            <ul className="list-disc pl-5">
              {clashes.map((c) => (
                <li key={`c${c.id}`}>
                  Confirmed reservation {fmtRange(c.startAt, c.endAt)} — {c.farmer ?? "—"} ({c.barangay ?? "—"})
                </li>
              ))}
              {pendingClashes.map((p) => (
                <li key={`p${p.id}`}>
                  Pending request {p.code} ({p.farmer}) — {fmtRange(p.start, p.end)}
                </li>
              ))}
            </ul>
          </Banner>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="🔄 Request lifecycle">
            <ol className="space-y-3">
              {timeline.map((t) => (
                <li key={t.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      t.done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {t.done ? "✓" : "•"}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${t.done ? "text-slate-800" : "text-slate-400"}`}>{t.label}</p>
                    <p className="text-xs text-slate-500">{t.at ? fmtDateTime(t.at) : "pending"}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="📍 Service destination">
            {reservation?.farmLat && reservation?.farmLng ? (
              <MapView
                markers={[
                  {
                    id: `req-${request.id}`,
                    lat: Number(reservation.farmLat),
                    lng: Number(reservation.farmLng),
                    title: reservation.farmName ?? "Service destination",
                    subtitle: request.serviceType,
                    detail: `Brgy. ${request.barangay ?? "—"}`,
                    emoji: "📌",
                    tone: "service",
                  },
                ]}
                center={[Number(reservation.farmLat), Number(reservation.farmLng)]}
                zoom={14}
                height={280}
                showDirections
              />
            ) : (
              <EmptyState icon="🗺️" title="Destination appears once the request is scheduled" />
            )}
          </Card>
        </div>
      </div>
    );
  }

  /* --------------------------- farmer profile -------------------------- */
  if (section === "farmers") {
    if (!isMao(user.role) && !["association", "barangay", "auditor"].includes(user.role)) {
      return <EmptyState icon="🔒" title="Access restricted" />;
    }
    return <FarmerDetailSection id={Number(id)} user={user} />;
  }

  if (section === "equipment") redirect(`/equipment/${id}`);
  if (section === "meetings") redirect("/dashboard/meetings");

  notFound();
}
