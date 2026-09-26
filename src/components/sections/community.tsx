import Link from "next/link";
import { Badge, Card, Disclosure, EmptyState, Field, Stat, TableShell, btn, inputClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/forms";
import {
  listAnnouncements,
  listApplications,
  listAssociations,
  listBarangays,
  listFarmers,
  listFarms,
  listMeetings,
  listPrograms,
  listRequests,
  meetingAttendees,
} from "@/lib/queries";
import { AiCropScanner } from "@/components/ai-scanner";
import { db } from "@/db";
import { plantDiagnoses, barangays as barangayTable } from "@/db/mysql-schema";
import { desc, eq } from "drizzle-orm";
import {
  applyProgramAction,
  deleteAnnouncementAction,
  markAnnouncementReadAction,
  meetingOpsAction,
  saveAnnouncementAction,
  saveMeetingAction,
  saveProgramAction,
  setAnnouncementStatusAction,
  setApplicationStatusAction,
} from "@/lib/actions";
import { isMao, type SessionUser } from "@/lib/session";
import { fmtDate, fmtDateTime, fmtRange, toDateInput, toLocalInput } from "@/lib/utils";

type SP = Record<string, string | undefined>;

/* ------------------------------ farmers ------------------------------ */

export async function FarmersSection({ user, sp }: { user: SessionUser; sp: SP }) {
  const mao = isMao(user.role);
  const [farmers, farms] = await Promise.all([listFarmers(sp.q), listFarms()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Farmer Directory</h1>
        <p className="text-sm text-slate-500">
          RSBSA-linked farmer records, farm holdings and service history. {mao ? "" : "Contact details are visible to MAO personnel only."}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Registered farmers" value={farmers.length} icon="🧑‍🌾" />
        <Stat label="Registered farms" value={farms.length} icon="🌱" tone="sky" />
        <Stat label="Total area (ha)" value={farms.reduce((s, f) => s + Number(f.areaHa), 0).toFixed(2)} icon="📐" tone="slate" />
        <Stat label="Associations" value={new Set(farmers.map((f) => f.association).filter(Boolean)).size} icon="🤝" tone="amber" />
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
        <Field label="Search farmer or RSBSA number" className="grow">
          <input name="q" defaultValue={sp.q ?? ""} className={inputClass} placeholder="e.g. Dela Cruz or RSBSA-175…" />
        </Field>
        <button className={btn.primary}>Search</button>
        <Link href="/dashboard/farmers" className={btn.ghost}>
          Reset
        </Link>
      </form>

      <Card title="📇 Farmer records">
        {farmers.length ? (
          <TableShell head={["Farmer", "RSBSA", "Barangay", "Association", "Main crop", "Area (ha)", "Contact", ""]}>
            {farmers.map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2">
                  <span className="text-xs font-bold text-slate-800">
                    {f.avatarEmoji} {f.name}
                  </span>
                  <span className="block text-[10px] text-slate-400">{f.address}</span>
                </td>
                <td className="px-3 py-2 text-xs">{f.rsbsaNumber || "—"}</td>
                <td className="px-3 py-2 text-xs">{f.barangay ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{f.association ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{f.mainCrop}</td>
                <td className="px-3 py-2 text-xs">{f.totalAreaHa}</td>
                <td className="px-3 py-2 text-xs">{mao ? `${f.phone} · ${f.email}` : "🔒 restricted"}</td>
                <td className="px-3 py-2">
                  <Link href={`/dashboard/farmers/${f.id}`} className={btn.smallGhost}>
                    Profile
                  </Link>
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <EmptyState icon="🧑‍🌾" title="No farmer matches your search" />
        )}
      </Card>
    </div>
  );
}

export async function FarmerDetailSection({ id, user }: { id: number; user: SessionUser }) {
  const mao = isMao(user.role);
  const farmers = await listFarmers();
  const farmer = farmers.find((f) => f.id === id);
  if (!farmer) return <EmptyState icon="🔍" title="Farmer record not found" />;
  const [farms, requests] = await Promise.all([listFarms(id), listRequests({ farmerId: id })]);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/farmers" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Farmer directory
      </Link>
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">{farmer.avatarEmoji}</span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{farmer.name}</h1>
            <p className="text-sm text-slate-500">
              {farmer.rsbsaNumber || "No RSBSA number"} · Brgy. {farmer.barangay ?? "—"} · {farmer.association ?? "No association"}
            </p>
            <p className="text-xs text-slate-500">{mao ? `${farmer.phone} · ${farmer.email}` : "🔒 Contact details restricted"}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge value={farmer.status} />
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["Main crop", farmer.mainCrop],
            ["Total area", `${farmer.totalAreaHa} ha`],
            ["Preferred contact", farmer.preferredContact],
            ["Registered", fmtDate(farmer.createdAt)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[10px] font-bold uppercase text-slate-500">{k}</dt>
              <dd className="text-sm font-semibold text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="🌱 Farm holdings">
          {farms.length ? (
            <ul className="space-y-2">
              {farms.map((f) => (
                <li key={f.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-bold text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-500">
                    {f.crop} · {f.areaHa} ha · Brgy. {f.barangay ?? "—"} · {f.landmark}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {f.lat}, {f.lng}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="🌱" title="No farm registered" />
          )}
        </Card>
        <Card title="📋 Request & service history">
          {requests.length ? (
            <TableShell head={["Code", "Service", "Schedule", "Status"]}>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-xs font-bold text-emerald-800">{r.code}</td>
                  <td className="px-3 py-2 text-xs">{r.serviceType}</td>
                  <td className="px-3 py-2 text-xs">{fmtRange(r.requestedStart, r.requestedEnd)}</td>
                  <td className="px-3 py-2">
                    <Badge value={r.status} />
                  </td>
                </tr>
              ))}
            </TableShell>
          ) : (
            <EmptyState icon="📋" title="No requests on file" />
          )}
        </Card>
      </div>
    </div>
  );
}

export async function AssociationsSection() {
  const [associations, farmers] = await Promise.all([listAssociations(), listFarmers()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Farmers&apos; Associations</h1>
        <p className="text-sm text-slate-500">Accredited associations and cooperatives coordinating with the MAO.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {associations.map((a) => {
          const members = farmers.filter((f) => f.association === a.name);
          return (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{a.name}</h2>
                  <p className="text-xs text-slate-500">{a.acronym}</p>
                </div>
                <Badge value={a.status} />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                <li>🏘️ Brgy. {a.barangay ?? "—"}</li>
                <li>👤 {a.contactPerson}</li>
                <li>📞 {a.contactNumber}</li>
                <li>🧑‍🌾 {members.length} registered member(s)</li>
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export async function BarangaysSection() {
  const [barangays, farmers, requests] = await Promise.all([listBarangays(), listFarmers(), listRequests()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Barangay Coverage</h1>
        <p className="text-sm text-slate-500">Agricultural profile and service demand per barangay of Baco.</p>
      </header>
      <Card>
        <TableShell head={["Barangay", "Farmland (ha)", "Registered farmers", "Requests filed", "Coordinates"]}>
          {barangays.map((b) => (
            <tr key={b.id}>
              <td className="px-3 py-2 text-xs font-bold text-slate-800">{b.name}</td>
              <td className="px-3 py-2 text-xs">{b.farmlandHa}</td>
              <td className="px-3 py-2 text-xs">{farmers.filter((f) => f.barangay === b.name).length}</td>
              <td className="px-3 py-2 text-xs">{requests.filter((r) => r.barangay === b.name).length}</td>
              <td className="px-3 py-2 text-[10px] text-slate-400">
                {b.lat}, {b.lng}
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}

/* --------------------------- announcements --------------------------- */

const CATEGORIES = [
  "General Announcement",
  "Agriculture Advisory",
  "Weather Warning",
  "Program",
  "Assistance",
  "Meeting",
  "Equipment Notice",
  "Schedule Change",
];

export async function AnnouncementsAdminSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const [items, barangays] = await Promise.all([listAnnouncements(), listBarangays()]);

  if (!mao) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-emerald-900">Announcements &amp; Advisories</h1>
          <p className="text-sm text-slate-500">Notices published by the Municipal Agriculture Office.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {items
            .filter((a) => a.status === "Published")
            .map((a) => (
              <Card key={a.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={a.priority} />
                  <Badge value={a.category} />
                  <span className="text-[11px] text-slate-400">{fmtDate(a.publishAt)}</span>
                </div>
                <h2 className="mt-2 text-base font-bold text-slate-900">{a.title}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.body}</p>
                <form action={markAnnouncementReadAction} className="mt-3">
                  <input type="hidden" name="id" value={a.id} />
                  <button className={btn.small}>✓ Mark as read</button>
                </form>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Announcement Management</h1>
        <p className="text-sm text-slate-500">
          Create, schedule, publish and archive advisories targeted to all farmers, a barangay or an association.
        </p>
      </header>

      <Card title="📝 Compose announcement">
        <Disclosure summary="Open composer" open>
          <form action={saveAnnouncementAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <input name="title" required className={inputClass} />
              </Field>
              <Field label="Category">
                <select name="category" className={inputClass} defaultValue="General Announcement">
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select name="priority" className={inputClass} defaultValue="Normal">
                  {["Normal", "Important", "Urgent"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Audience">
                <select name="audience" className={inputClass} defaultValue="All Farmers">
                  {["All Farmers", "Selected Barangay", "Selected Association", "MAO Personnel", "Operators"].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Target barangay (optional)">
                <select name="barangayId" className={inputClass} defaultValue="">
                  <option value="">All barangays</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Publish at">
                <input type="datetime-local" name="publishAt" defaultValue={toLocalInput(new Date())} className={inputClass} />
              </Field>
              <Field label="Expires at">
                <input type="datetime-local" name="expiresAt" className={inputClass} />
              </Field>
              <Field label="Attachment name">
                <input name="attachmentName" className={inputClass} placeholder="advisory.pdf" />
              </Field>
              <Field label="Status">
                <select name="status" className={inputClass} defaultValue="Published">
                  {["Published", "Draft", "Scheduled", "Archived"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Content">
              <textarea name="body" rows={5} required className={inputClass} />
            </Field>
            <button className={btn.primary}>Save announcement</button>
          </form>
        </Disclosure>
      </Card>

      <Card title="🗂️ Published & archived announcements">
        <TableShell head={["Title", "Category", "Priority", "Audience", "Publish", "Expires", "Views", "Actions"]}>
          {items.map((a) => (
            <tr key={a.id}>
              <td className="px-3 py-2">
                <Link href={`/announcements?id=${a.id}`} className="text-xs font-bold text-emerald-800 hover:underline">
                  {a.title}
                </Link>
                <span className="block text-[10px] text-slate-400">{a.status}</span>
              </td>
              <td className="px-3 py-2 text-xs">{a.category}</td>
              <td className="px-3 py-2">
                <Badge value={a.priority} />
              </td>
              <td className="px-3 py-2 text-xs">
                {a.audience}
                {a.barangay ? ` · ${a.barangay}` : ""}
              </td>
              <td className="px-3 py-2 text-xs">{fmtDate(a.publishAt)}</td>
              <td className="px-3 py-2 text-xs">{fmtDate(a.expiresAt)}</td>
              <td className="px-3 py-2 text-xs">{a.views}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  <form action={setAnnouncementStatusAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value={a.status === "Archived" ? "Published" : "Archived"} />
                    <button className={btn.smallGhost}>{a.status === "Archived" ? "Republish" : "Archive"}</button>
                  </form>
                  {user.role === "admin" && (
                    <form action={deleteAnnouncementAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <ConfirmSubmit label="Delete" message="Delete this announcement permanently?" />
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}

/* ------------------------------ meetings ----------------------------- */

export async function MeetingsSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const [meetings, attendees, barangays] = await Promise.all([listMeetings(), meetingAttendees(), listBarangays()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Meetings &amp; Assemblies</h1>
        <p className="text-sm text-slate-500">
          {mao ? "Create meeting notices, monitor attendance and upload minutes." : "Meeting notices and your attendance confirmation."}
        </p>
      </header>

      {mao && (
        <Card title="📅 Create meeting notice">
          <Disclosure summary="Open meeting form">
            <form action={saveMeetingAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title" className="sm:col-span-2">
                  <input name="title" required className={inputClass} />
                </Field>
                <Field label="Start">
                  <input type="datetime-local" name="startAt" required className={inputClass} />
                </Field>
                <Field label="End">
                  <input type="datetime-local" name="endAt" required className={inputClass} />
                </Field>
                <Field label="Venue">
                  <input name="venue" required className={inputClass} placeholder="MAO Conference Room" />
                </Field>
                <Field label="Organizer">
                  <input name="organizer" defaultValue="Municipal Agriculture Office" className={inputClass} />
                </Field>
                <Field label="Audience">
                  <select name="audience" className={inputClass} defaultValue="All Farmers">
                    {["All Farmers", "Selected Barangay", "Selected Association", "Operators", "MAO Personnel"].map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Barangay (optional)">
                  <select name="barangayId" className={inputClass} defaultValue="">
                    <option value="">Municipality-wide</option>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Agenda">
                <textarea name="agenda" rows={3} className={inputClass} placeholder={"1. Call to order\n2. …"} />
              </Field>
              <Field label="Description">
                <input name="description" className={inputClass} />
              </Field>
              <Field label="Attachment name">
                <input name="attachmentName" className={inputClass} placeholder="agenda.pdf" />
              </Field>
              <button className={btn.primary}>Publish meeting notice &amp; invite participants</button>
            </form>
          </Disclosure>
        </Card>
      )}

      <div className="space-y-4">
        {meetings.map((m) => {
          const list = attendees.filter((a) => a.meetingId === m.id);
          const mine = list.find((a) => a.userId === user.id);
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={m.status} />
                    <span className="text-[11px] text-slate-400">{m.audience}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{m.title}</h2>
                  <p className="text-xs text-slate-500">
                    🗓️ {fmtRange(m.startAt, m.endAt)} · 📍 {m.venue} · 👤 {m.organizer}
                  </p>
                  {m.agenda && (
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-xs text-slate-600">{m.agenda}</pre>
                  )}
                  {m.minutes && (
                    <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
                      <span className="font-bold">Minutes:</span> {m.minutes}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                    {list.filter((a) => a.status === "Confirmed").length} confirmed ·{" "}
                    {list.filter((a) => a.status === "Attended").length} attended · {list.length} invited
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {m.status === "Upcoming" && (
                    <form action={meetingOpsAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="op" value="rsvp" />
                      <select name="status" defaultValue={mine?.status ?? "Confirmed"} className={`${inputClass} !w-auto !py-1.5 text-xs`}>
                        {["Confirmed", "Invited", "Absent"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <button className={btn.small}>My attendance</button>
                    </form>
                  )}

                  {mao && (
                    <Disclosure summary="Manage meeting" tone="ghost">
                      <div className="space-y-3">
                        <form action={meetingOpsAction} className="flex items-end gap-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="op" value="status" />
                          <Field label="Status">
                            <select name="status" defaultValue={m.status} className={inputClass}>
                              {["Upcoming", "Ongoing", "Completed", "Cancelled"].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </Field>
                          <button className={btn.small}>Update</button>
                        </form>
                        <form action={meetingOpsAction} className="space-y-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="op" value="minutes" />
                          <Field label="Minutes / notes">
                            <textarea name="minutes" rows={3} defaultValue={m.minutes} className={inputClass} />
                          </Field>
                          <button className={btn.small}>Save minutes &amp; mark completed</button>
                        </form>
                        <div>
                          <p className="mb-1 text-xs font-bold text-slate-600">Attendance sheet</p>
                          <div className="max-h-56 space-y-1 overflow-y-auto">
                            {list.map((a) => (
                              <form key={a.id} action={meetingOpsAction} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={m.id} />
                                <input type="hidden" name="op" value="attendance" />
                                <input type="hidden" name="attendanceId" value={a.id} />
                                <span className="w-40 truncate text-[11px] text-slate-600">{a.name}</span>
                                <select name="status" defaultValue={a.status} className={`${inputClass} !w-auto !py-1 text-[11px]`}>
                                  {["Invited", "Confirmed", "Attended", "Absent"].map((s) => (
                                    <option key={s}>{s}</option>
                                  ))}
                                </select>
                                <button className={btn.small}>Set</button>
                              </form>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Disclosure>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ programs ----------------------------- */

export async function ProgramsSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const [programs, applications] = await Promise.all([
    listPrograms(),
    listApplications(mao || user.role === "auditor" ? undefined : user.farmerId ?? -1),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-emerald-900">Agricultural Assistance &amp; Programs</h1>
        <p className="text-sm text-slate-500">
          {mao ? "Publish programmes and evaluate farmer applications." : "Apply to MAO programmes and track your application status."}
        </p>
      </header>

      {mao && (
        <Card title="🎁 Create / update programme">
          <Disclosure summary="Open programme form">
            <form action={saveProgramAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title" className="sm:col-span-2">
                  <input name="title" required className={inputClass} />
                </Field>
                <Field label="Assistance type">
                  <select name="assistanceType" className={inputClass} defaultValue="Input Subsidy">
                    {["Input Subsidy", "Machinery Grant", "Training", "Financial Assistance", "Infrastructure"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select name="status" className={inputClass} defaultValue="Open">
                    {["Open", "Upcoming", "Closed"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Opens at">
                  <input type="date" name="opensAt" defaultValue={toDateInput(new Date())} className={inputClass} />
                </Field>
                <Field label="Deadline">
                  <input type="date" name="deadline" className={inputClass} />
                </Field>
                <Field label="Slots">
                  <input type="number" name="slots" defaultValue={50} className={inputClass} />
                </Field>
              </div>
              <Field label="Description">
                <textarea name="description" rows={2} className={inputClass} />
              </Field>
              <Field label="Eligibility">
                <textarea name="eligibility" rows={2} className={inputClass} />
              </Field>
              <button className={btn.primary}>Save programme</button>
            </form>
          </Disclosure>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((p) => {
          const mine = applications.find((a) => a.programId === p.id && a.farmerId === user.farmerId);
          return (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={p.status} />
                <Badge value={p.assistanceType} />
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{p.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-semibold">Eligibility:</span> {p.eligibility}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                🗓️ {fmtDate(p.opensAt)} – {fmtDate(p.deadline)} · 🎫 {p.slots} slots
              </p>
              {user.farmerId && p.status === "Open" && !mine && (
                <form action={applyProgramAction} className="mt-3 flex items-end gap-2">
                  <input type="hidden" name="programId" value={p.id} />
                  <Field label="Notes (optional)" className="grow">
                    <input name="notes" className={inputClass} placeholder="Area to be covered, preferred schedule…" />
                  </Field>
                  <button className={btn.small}>Apply</button>
                </form>
              )}
              {mine && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Your application: <strong>{mine.status}</strong> · filed {fmtDate(mine.submittedAt)}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Card title={mao ? "🗃️ Applications received" : "🗃️ My applications"}>
        {applications.length ? (
          <TableShell head={["Programme", "Applicant", "Barangay", "Submitted", "Status", mao ? "Action" : ""]}>
            {applications.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 text-xs font-semibold">{a.programTitle}</td>
                <td className="px-3 py-2 text-xs">{a.farmerName}</td>
                <td className="px-3 py-2 text-xs">{a.barangay ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{fmtDateTime(a.submittedAt)}</td>
                <td className="px-3 py-2">
                  <Badge value={a.status} />
                </td>
                <td className="px-3 py-2">
                  {mao && (
                    <form action={setApplicationStatusAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status} className={`${inputClass} !w-auto !py-1 text-[11px]`}>
                        {["Submitted", "Under Review", "Approved", "Rejected", "Completed"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <input name="notes" placeholder="notes" className={`${inputClass} !w-28 !py-1 text-[11px]`} defaultValue={a.notes} />
                      <button className={btn.small}>Set</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <EmptyState icon="🗃️" title="No applications yet" />
        )}
      </Card>
    </div>
  );
}

/* ----------------------------- diagnostics ---------------------------- */

export async function DiagnosticsDashboardSection({ user }: { user: SessionUser }) {
  const mao = isMao(user.role);
  const barangays = await listBarangays();

  type ScanRow = {
    id: number;
    cropType: string;
    diseaseName: string;
    scientificName: string;
    confidence: string;
    severity: string;
    farmerName: string;
    status: string;
    technologistNotes: string;
    createdAt: Date;
    barangay: string | null;
  };

  let scans: ScanRow[] = [];
  try {
    const query = db
      .select({
        id: plantDiagnoses.id,
        cropType: plantDiagnoses.cropType,
        diseaseName: plantDiagnoses.diseaseName,
        scientificName: plantDiagnoses.scientificName,
        confidence: plantDiagnoses.confidence,
        severity: plantDiagnoses.severity,
        farmerName: plantDiagnoses.farmerName,
        status: plantDiagnoses.status,
        technologistNotes: plantDiagnoses.technologistNotes,
        createdAt: plantDiagnoses.createdAt,
        barangay: barangayTable.name,
      })
      .from(plantDiagnoses)
      .leftJoin(barangayTable, eq(barangayTable.id, plantDiagnoses.barangayId))
      .orderBy(desc(plantDiagnoses.createdAt));

    if (!mao && user.role !== "auditor") {
      scans = await query.where(eq(plantDiagnoses.userId, user.id));
    } else {
      scans = await query.limit(50);
    }
  } catch (err) {
    console.error("Failed to query plant diagnoses:", err);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">🔬 AI Crop Doctor &amp; Disease Diagnostics</h1>
          <p className="text-sm text-slate-500">
            {mao
              ? "Municipality-wide plant disease scans, outbreak surveillance, and prescription tracking."
              : "Scan your crops, identify leaf diseases and pests, and receive immediate treatment protocols."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/requests/new" className={btn.primary}>
            🚜 Request Equipment / Sprayer
          </Link>
        </div>
      </header>

      {/* Embedded High-Tech Scanner */}
      <AiCropScanner
        userBarangayId={user.barangayId}
        userName={user.name}
        barangays={barangays.map((b) => ({ id: b.id, name: b.name }))}
      />

      {/* History Table */}
      <Card title={mao ? "📋 Municipal Crop Disease Scans" : "📋 My Diagnostic History"}>
        {scans.length ? (
          <TableShell head={["Crop", "Diagnosed Disease", "Confidence", "Severity", "Location", "Date", "Status"]}>
            {scans.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 text-xs font-bold text-slate-800">🌾 {s.cropType}</td>
                <td className="px-3 py-2 text-xs">
                  <span className="font-semibold text-emerald-950">{s.diseaseName}</span>
                  <span className="block text-[10px] text-slate-400 italic">{s.scientificName}</span>
                </td>
                <td className="px-3 py-2 text-xs font-bold text-slate-700">{s.confidence}%</td>
                <td className="px-3 py-2">
                  <Badge value={s.severity} />
                </td>
                <td className="px-3 py-2 text-xs">{s.barangay ?? "Baco"}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(s.createdAt)}</td>
                <td className="px-3 py-2">
                  <Badge value={s.status} />
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <EmptyState icon="🔬" title="No diagnostic scans recorded yet" hint="Use the camera or upload a crop photo above to run a plant health scan." />
        )}
      </Card>
    </div>
  );
}
