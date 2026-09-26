import Link from "next/link";
import { Badge, Banner, Card, Disclosure, EmptyState, Field, MonthCalendar, Stat, TableShell, btn, inputClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/forms";
import MapView from "@/components/map-view";
import {
  listBarangays,
  listOperators,
  listRequests,
  listReservations,
  pendingConflicts,
  reservationFarmerNames,
  schedulingConflicts,
} from "@/lib/queries";
import { reviewRequestAction, scheduleActionsAction, updateRequestStatusAction } from "@/lib/actions";
import { isMao, type SessionUser } from "@/lib/session";
import { addMonths, fmtDate, fmtDateTime, fmtRange, startOfMonth, toLocalInput } from "@/lib/utils";

type SP = Record<string, string | undefined>;

/* ----------------------------- requests ----------------------------- */

const STATUS_FILTERS = ["all", "Submitted", "Under Review", "Approved", "In Progress", "Completed", "Rejected", "Cancelled"];

export async function RequestsSection({ user, sp }: { user: SessionUser; sp: SP }) {
  const mao = isMao(user.role);
  const filters = { status: sp.status ?? "all", farmerId: mao || user.role === "auditor" ? undefined : user.farmerId ?? -1 };
  const [requests, operators, conflicts] = await Promise.all([
    listRequests(filters),
    listOperators(),
    pendingConflicts(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">{mao ? "Equipment & Resource Request Queue" : "My Requests"}</h1>
          <p className="text-sm text-slate-500">
            {mao
              ? "Review, approve, reject or reschedule farmer requests. Conflicts are detected automatically before approval."
              : "Track the status of every request you filed with the Municipal Agriculture Office."}
          </p>
        </div>
        {!mao && (
          <Link href="/dashboard/requests/new" className={btn.primary}>
            ➕ New request
          </Link>
        )}
      </header>

      {sp.submitted && (
        <Banner tone="success" title={`Request ${sp.submitted} submitted successfully`}>
          Your request is now in the MAO review queue. You will receive a notification once it is acted upon.
        </Banner>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={`/dashboard/requests?status=${s}`} className={(sp.status ?? "all") === s ? btn.small : btn.smallGhost}>
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState icon="📋" title="No requests found for this filter" hint={mao ? "The queue is clear." : "Submit a request to get started."} />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const conflict = conflicts[r.id];
            const open = ["Submitted", "Under Review"].includes(r.status);
            return (
              <Card key={r.id} className={conflict ? "border-rose-300" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/dashboard/requests/${r.id}`} className="text-sm font-black text-emerald-800 hover:underline">
                        {r.code}
                      </Link>
                      <Badge value={r.status} />
                      <Badge value={r.priority} />
                      {conflict && <Badge value="Conflict" />}
                    </div>
                    <p className="mt-1.5 text-base font-bold text-slate-900">
                      {r.serviceType} · {r.equipmentName ?? r.resourceName ?? "Resource"}
                    </p>
                    <p className="text-xs text-slate-500">
                      🧑‍🌾 {r.farmerName} · 📍 {r.farmName ?? "—"}, Brgy. {r.barangay ?? "—"} · 🌾 {r.cropType}, {r.areaHa} ha
                    </p>
                    <p className="text-xs text-slate-500">🗓️ Requested: {fmtRange(r.requestedStart, r.requestedEnd)} · filed {fmtDate(r.createdAt)}</p>
                    {r.purpose && <p className="mt-2 max-w-3xl text-sm text-slate-600">“{r.purpose}”</p>}
                    {r.reviewNotes && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="font-bold">MAO remarks:</span> {r.reviewNotes}
                      </p>
                    )}
                    {r.attachmentName && <p className="mt-1 text-xs text-slate-500">📎 {r.attachmentName}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {mao && open && (
                      <Disclosure summary="Review this request">
                        <form action={reviewRequestAction} className="space-y-3">
                          <input type="hidden" name="requestId" value={r.id} />
                          {conflict && (
                            <Banner tone="warn" title="Conflict detected">
                              {conflict.map((c) => (
                                <p key={c.when}>Overlaps with {c.with} — {c.when}</p>
                              ))}
                            </Banner>
                          )}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Confirmed start">
                              <input type="datetime-local" name="startAt" defaultValue={toLocalInput(r.requestedStart)} className={inputClass} />
                            </Field>
                            <Field label="Confirmed end">
                              <input type="datetime-local" name="endAt" defaultValue={toLocalInput(r.requestedEnd)} className={inputClass} />
                            </Field>
                            <Field label="Assign operator / driver">
                              <select name="operatorId" className={inputClass} defaultValue="">
                                <option value="">Assign later…</option>
                                {operators.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name} — {o.specialization}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Mark as harvester deployment">
                              <select name="isHarvester" className={inputClass} defaultValue={r.serviceType === "Harvesting" ? "1" : "0"}>
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                              </select>
                            </Field>
                          </div>
                          <Field label="Remarks to the farmer">
                            <textarea name="reviewNotes" rows={2} className={inputClass} placeholder="Reason for rejection, revision instructions or reminders…" />
                          </Field>
                          <div className="flex flex-wrap gap-2">
                            <button name="decision" value="approve" className={btn.primary}>
                              ✅ Approve &amp; schedule
                            </button>
                            <button name="decision" value="revise" className={btn.ghost}>
                              ✏️ Request revision
                            </button>
                            <ConfirmSubmit
                              label="⛔ Reject"
                              message="Reject this request? The farmer will be notified."
                              name="decision"
                              value="reject"
                            />
                          </div>
                        </form>
                      </Disclosure>
                    )}

                    {mao && ["Approved", "In Progress"].includes(r.status) && (
                      <form action={updateRequestStatusAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="requestId" value={r.id} />
                        <select name="status" defaultValue={r.status === "Approved" ? "In Progress" : "Completed"} className={`${inputClass} !w-auto !py-1.5 text-xs`}>
                          {["In Progress", "Completed", "Cancelled"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <button className={btn.small}>Update status</button>
                      </form>
                    )}

                    {!mao && ["Submitted", "Under Review", "Approved"].includes(r.status) && (
                      <form action={updateRequestStatusAction}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="status" value="Cancelled" />
                        <ConfirmSubmit label="Cancel request" message="Cancel this request? This cannot be undone." />
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------- harvester / calendar -------------------- */

export async function SchedulingSection({
  user,
  sp,
  harvesterOnly,
}: {
  user: SessionUser;
  sp: SP;
  harvesterOnly: boolean;
}) {
  const mao = isMao(user.role);
  const month = sp.month ? new Date(`${sp.month}-01T00:00:00`) : startOfMonth(new Date());
  const barangayId = sp.barangay && sp.barangay !== "all" ? Number(sp.barangay) : undefined;
  const from = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 2, 0);

  const [reservations, barangays, operators, conflicts] = await Promise.all([
    listReservations({
      from,
      to,
      barangayId,
      harvesterOnly,
      farmerId: !mao && user.role === "farmer" && user.farmerId ? user.farmerId : undefined,
    }),
    listBarangays(),
    listOperators(),
    schedulingConflicts(),
  ]);
  const names = await reservationFarmerNames(reservations.map((r) => r.farmerId).filter((x): x is number => !!x));
  const conflictIds = new Set(conflicts.flatMap((c) => [c.a.id, c.b.id]));

  const events = reservations.map((r) => ({
    id: r.id,
    date: new Date(r.startAt),
    title: `${r.assetCode ?? ""} ${r.barangay ?? ""}`,
    tone: r.status,
    conflict: conflictIds.has(r.id),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">
            {harvesterOnly ? "Harvester Scheduling" : "Equipment Reservation Calendar"}
          </h1>
          <p className="text-sm text-slate-500">
            Municipality-wide schedule with automatic double-booking prevention and operator assignment.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`?month=${addMonths(month, -1).toISOString().slice(0, 7)}`} className={btn.ghost}>
            ← {addMonths(month, -1).toLocaleDateString("en-PH", { month: "short" })}
          </Link>
          <Link href={`?month=${addMonths(month, 1).toISOString().slice(0, 7)}`} className={btn.ghost}>
            {addMonths(month, 1).toLocaleDateString("en-PH", { month: "short" })} →
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Scheduled" value={reservations.filter((r) => r.status === "Scheduled").length} icon="🗓️" tone="sky" />
        <Stat label="In progress" value={reservations.filter((r) => r.status === "In Progress").length} icon="⚙️" />
        <Stat label="Completed" value={reservations.filter((r) => r.status === "Completed").length} icon="🏁" tone="slate" />
        <Stat label="Conflicts" value={conflicts.length} icon="⚠️" tone={conflicts.length ? "rose" : "slate"} />
      </div>

      {conflicts.length > 0 && (
        <Banner tone="danger" title={`${conflicts.length} overlapping reservation(s) detected`}>
          <ul className="list-disc pl-5">
            {conflicts.map((c, i) => (
              <li key={i}>
                <strong>{c.a.equipmentName}</strong>: {fmtRange(c.a.startAt, c.a.endAt)} ↔ {fmtRange(c.b.startAt, c.b.endAt)} — reschedule one
                of the bookings below.
              </li>
            ))}
          </ul>
        </Banner>
      )}

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <Field label="Month">
          <input type="month" name="month" defaultValue={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`} className={inputClass} />
        </Field>
        <Field label="Barangay">
          <select name="barangay" defaultValue={sp.barangay ?? "all"} className={inputClass}>
            <option value="all">All barangays</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <button className={btn.primary}>Filter</button>
      </form>

      <Card title={`📅 ${month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`}>
        <MonthCalendar month={month} events={events} />
      </Card>

      <Card title="🧾 Reservation list" subtitle={mao ? "Assign operators, reschedule and update service status" : "Your confirmed schedule"}>
        {reservations.length ? (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className={`rounded-xl border p-4 ${conflictIds.has(r.id) ? "border-rose-300 bg-rose-50/60" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-800">{r.equipmentName}</span>
                      <Badge value={conflictIds.has(r.id) ? "Conflict" : r.status} />
                      {r.isHarvester && <Badge value="Harvester" />}
                      {r.code && <span className="text-[11px] text-slate-400">{r.code}</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      🗓️ {fmtRange(r.startAt, r.endAt)} · 📍 {r.farmName ?? "—"}, Brgy. {r.barangay ?? "—"}
                    </p>
                    <p className="text-xs text-slate-600">
                      🧑‍🌾 {r.farmerId ? names.get(r.farmerId) ?? "—" : "—"} · 👷 {r.operatorName ?? "No operator assigned"}
                      {r.operatorPhone ? ` (${r.operatorPhone})` : ""}
                    </p>
                    {r.remarks && <p className="mt-1 text-xs italic text-slate-500">“{r.remarks}”</p>}
                  </div>

                  {mao && (
                    <div className="flex flex-col gap-2">
                      <Disclosure summary="Manage" tone="ghost">
                        <div className="space-y-3">
                          <form action={scheduleActionsAction} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="reservationId" value={r.id} />
                            <input type="hidden" name="op" value="assign" />
                            <Field label="Operator">
                              <select name="operatorId" defaultValue={r.operatorId ?? ""} className={inputClass}>
                                <option value="">Unassigned</option>
                                {operators.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <button className={btn.small}>Assign</button>
                          </form>

                          <form action={scheduleActionsAction} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="reservationId" value={r.id} />
                            <input type="hidden" name="op" value="reschedule" />
                            <Field label="New start">
                              <input type="datetime-local" name="startAt" defaultValue={toLocalInput(r.startAt)} className={inputClass} />
                            </Field>
                            <Field label="New end">
                              <input type="datetime-local" name="endAt" defaultValue={toLocalInput(r.endAt)} className={inputClass} />
                            </Field>
                            <button className={btn.small}>Reschedule</button>
                          </form>

                          <form action={scheduleActionsAction} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="reservationId" value={r.id} />
                            <input type="hidden" name="op" value="status" />
                            <Field label="Service status">
                              <select name="status" defaultValue={r.status} className={inputClass}>
                                {["Scheduled", "In Progress", "Completed", "Cancelled"].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </Field>
                            <button className={btn.small}>Update</button>
                          </form>
                        </div>
                      </Disclosure>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🗓️" title="No reservations in this period" />
        )}
      </Card>
    </div>
  );
}

/* ---------------------------- assignments ---------------------------- */

export async function AssignmentsSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const operators = await listOperators();
  const me = operators.find((o) => o.userId === user.id);
  const reservations = await listReservations(mao ? { from: new Date(new Date().setDate(new Date().getDate() - 7)) } : { operatorId: me?.id ?? -1 });
  const names = await reservationFarmerNames(reservations.map((r) => r.farmerId).filter((x): x is number => !!x));

  const markers = reservations
    .filter((r) => r.farmLat && r.farmLng)
    .map((r) => ({
      id: `a-${r.id}`,
      lat: Number(r.farmLat),
      lng: Number(r.farmLng),
      title: r.farmName ?? "Service destination",
      subtitle: `${r.equipmentName ?? ""} · ${r.serviceType}`,
      detail: `${fmtDateTime(r.startAt)} · Brgy. ${r.barangay ?? "—"}`,
      emoji: "📌",
      tone: "service" as const,
    }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">{mao ? "Operator Assignments" : "My Field Assignments"}</h1>
        <p className="text-sm text-slate-500">
          Destination details, contact information and turn-by-turn directions for every deployment.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="🚚 Assignment list">
          {reservations.length ? (
            <TableShell head={["Schedule", "Equipment", "Destination", "Farmer", "Operator", "Status", "Action"]}>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-xs font-semibold">{fmtRange(r.startAt, r.endAt)}</td>
                  <td className="px-3 py-2 text-xs">{r.equipmentName}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.farmName ?? "—"}
                    <span className="block text-[10px] text-slate-400">Brgy. {r.barangay ?? "—"}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.farmerId ? names.get(r.farmerId) ?? "—" : "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.operatorName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge value={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {r.farmLat && r.farmLng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${r.farmLat},${r.farmLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className={btn.smallGhost}
                        >
                          ➤ Directions
                        </a>
                      )}
                      {(mao || user.role === "operator") && r.status !== "Completed" && (
                        <form action={scheduleActionsAction} className="flex gap-1">
                          <input type="hidden" name="reservationId" value={r.id} />
                          <input type="hidden" name="op" value="status" />
                          <select name="status" defaultValue={r.status === "Scheduled" ? "In Progress" : "Completed"} className={`${inputClass} !w-auto !py-1 text-[11px]`}>
                            {["In Progress", "Completed"].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <button className={btn.small}>Set</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </TableShell>
          ) : (
            <EmptyState icon="🛻" title="No assignments" hint="Assignments appear when the MAO approves a request and assigns you." />
          )}
        </Card>

        <Card title="🗺️ Destinations">
          <MapView markers={markers} height={420} showDirections />
        </Card>
      </div>
    </div>
  );
}
