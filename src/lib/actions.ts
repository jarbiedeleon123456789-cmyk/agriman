"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcementReads,
  announcements,
  applications,
  auditLogs,
  equipment,
  farmers,
  farms,
  maintenanceRecords,
  marketPrices,
  meetingAttendance,
  meetings,
  notifications,
  operators,
  programs,
  requests,
  reservations,
  resources,
  settings,
  users,
  waitlist,
} from "@/db/schema";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  isMao,
  requireUser,
  verifyPassword,
  type SessionUser,
} from "@/lib/session";
import { reservationConflicts, suggestSlots } from "@/lib/queries";
import { fmtRange } from "@/lib/utils";

export type ActionState = {
  error?: string;
  success?: string;
  conflicts?: string[];
  suggestions?: string[];
} | null;

/* ----------------------------- helpers ------------------------------ */

function s(fd: FormData, key: string, fallback = "") {
  const v = fd.get(key);
  return typeof v === "string" && v.length ? v : fallback;
}
function n(fd: FormData, key: string): number | null {
  const v = s(fd, key);
  if (!v) return null;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
}
function dt(fd: FormData, key: string): Date | null {
  const v = s(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function refresh() {
  revalidatePath("/", "layout");
}

async function logAudit(
  user: SessionUser | null,
  action: string,
  module: string,
  recordId: string,
  details: string,
) {
  await db.insert(auditLogs).values({
    userId: user?.id ?? null,
    userName: user?.name ?? "System",
    action,
    module,
    recordId,
    details,
  });
}

async function notify(userId: number, type: string, title: string, message: string, link = "") {
  await db.insert(notifications).values({ userId, type, title, message, link });
}

async function notifyMao(type: string, title: string, message: string, link = "") {
  const staff = await db.select({ id: users.id }).from(users).where(sql`${users.role} in ('admin','staff')`);
  for (const st of staff) await notify(st.id, type, title, message, link);
}

async function farmerUserId(farmerId: number) {
  const rows = await db.select({ userId: farmers.userId }).from(farmers).where(eq(farmers.id, farmerId)).limit(1);
  return rows[0]?.userId ?? null;
}

/* ------------------------------- auth ------------------------------- */

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = s(fd, "email").toLowerCase().trim();
  const password = s(fd, "password");
  if (!email || !password) return { error: "Email and password are required." };

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password. Try the demo accounts listed below." };
  }
  if (user.status !== "Active") return { error: "This account is deactivated. Please contact the MAO." };

  await createSession(user.id);
  await logAudit(
    { ...user, role: user.role as SessionUser["role"], farmerId: null } as SessionUser,
    "LOGIN",
    "Authentication",
    `USR-${user.id}`,
    `${user.name} signed in.`,
  );
  refresh();
  redirect("/dashboard");
}

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = s(fd, "name").trim();
  const email = s(fd, "email").toLowerCase().trim();
  const password = s(fd, "password");
  const phone = s(fd, "phone");
  const barangayId = n(fd, "barangayId");
  const rsbsa = s(fd, "rsbsaNumber");

  if (!name || !email || password.length < 6) {
    return { error: "Complete name, email and a password of at least 6 characters are required." };
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { error: "An account already uses this email address." };

  const inserted = await db
    .insert(users)
    .values({ name, email, phone, passwordHash: hashPassword(password), role: "farmer", barangayId })
    .returning({ id: users.id });
  const userId = inserted[0].id;
  await db.insert(farmers).values({
    userId,
    barangayId,
    rsbsaNumber: rsbsa,
    address: s(fd, "address"),
    mainCrop: s(fd, "mainCrop", "Rice"),
    preferredContact: s(fd, "preferredContact", "Mobile"),
  });
  await notify(userId, "system", "Welcome to AgriShare", "Your farmer account has been created. You may now request MAO equipment and resources.", "/dashboard");
  await notifyMao("system", "New farmer registration", `${name} registered an AgriShare account.`, "/dashboard/farmers");
  await logAudit(null, "REGISTER", "User Management", `USR-${userId}`, `${name} self-registered as farmer.`);
  await createSession(userId);
  refresh();
  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) await logAudit(user, "LOGOUT", "Authentication", `USR-${user.id}`, `${user.name} signed out.`);
  await destroySession();
  refresh();
  redirect("/login");
}

/* ----------------------------- requests ----------------------------- */

export async function createRequestAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.farmerId) return { error: "Only farmer accounts can submit resource requests." };

  const equipmentId = n(fd, "equipmentId");
  const resourceId = n(fd, "resourceId");
  const start = dt(fd, "requestedStart");
  const end = dt(fd, "requestedEnd");
  if (!equipmentId && !resourceId) return { error: "Select the equipment or resource you need." };
  if (!start || !end) return { error: "Select the preferred service date and time." };
  if (end <= start) return { error: "The end of the service period must be after the start." };

  const waitlistOnly = s(fd, "mode") === "waitlist";

  if (equipmentId && !waitlistOnly) {
    const clash = await reservationConflicts(equipmentId, start, end);
    if (clash.length) {
      const slots = await suggestSlots(equipmentId, new Date(), 21);
      return {
        error: "Scheduling conflict detected — this unit is already booked for the selected period.",
        conflicts: clash.map((c) => `${fmtRange(c.startAt, c.endAt)} · ${c.farmer ?? "reserved"} (${c.barangay ?? "—"})`),
        suggestions: slots.map((sl) => fmtRange(sl.start, sl.end)),
      };
    }
  }

  const code = `REQ-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(
    1000 + Math.random() * 8999,
  )}`;

  const inserted = await db
    .insert(requests)
    .values({
      code,
      farmerId: user.farmerId,
      equipmentId,
      resourceId,
      farmId: n(fd, "farmId"),
      barangayId: n(fd, "barangayId") ?? user.barangayId,
      serviceType: s(fd, "serviceType", "Harvesting"),
      requestedStart: start,
      requestedEnd: end,
      purpose: s(fd, "purpose"),
      cropType: s(fd, "cropType", "Rice"),
      areaHa: s(fd, "areaHa", "0"),
      priority: s(fd, "priority", "Normal"),
      attachmentName: s(fd, "attachmentName"),
      notes: s(fd, "notes"),
      status: "Submitted",
    })
    .returning({ id: requests.id });

  if (waitlistOnly && equipmentId) {
    await db.insert(waitlist).values({
      requestId: inserted[0].id,
      equipmentId,
      farmerId: user.farmerId,
      preferredDate: start.toISOString().slice(0, 10),
      note: "Auto-queued: preferred period was already booked.",
    });
  }

  await notify(user.id, "request", `Request ${code} submitted`, "Your request was received and is now queued for MAO review.", "/dashboard/requests");
  await notifyMao("request", `New request ${code}`, `${user.name} submitted a ${s(fd, "serviceType", "service")} request.`, "/dashboard/requests");
  await logAudit(user, "CREATE", "Equipment Requests", code, `Submitted ${s(fd, "serviceType")} request.`);
  refresh();
  redirect(`/dashboard/requests?submitted=${code}`);
}

export async function reviewRequestAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const requestId = n(fd, "requestId");
  const decision = s(fd, "decision");
  if (!requestId) return;

  const rows = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  const req = rows[0];
  if (!req) return;
  const notes = s(fd, "reviewNotes");
  const targetUser = await farmerUserId(req.farmerId);

  if (decision === "approve") {
    const start = dt(fd, "startAt") ?? new Date(req.requestedStart);
    const end = dt(fd, "endAt") ?? new Date(req.requestedEnd);
    if (req.equipmentId) {
      const clash = await reservationConflicts(req.equipmentId, start, end);
      if (clash.length) {
        await db
          .update(requests)
          .set({ status: "Under Review", reviewNotes: `Conflict detected with an existing reservation (${fmtRange(clash[0].startAt, clash[0].endAt)}). Reschedule before approving.`, reviewedBy: user.id, reviewedAt: new Date() })
          .where(eq(requests.id, requestId));
        if (targetUser)
          await notify(targetUser, "conflict", `Conflict on ${req.code}`, "The requested period overlaps an existing booking. MAO will propose a new schedule.", "/dashboard/requests");
        await logAudit(user, "CONFLICT", "Equipment Requests", req.code, "Approval blocked by schedule conflict.");
        refresh();
        return;
      }
      const operatorId = n(fd, "operatorId");
      const isHarvester = s(fd, "isHarvester") === "1" || req.serviceType === "Harvesting";
      await db.insert(reservations).values({
        requestId,
        equipmentId: req.equipmentId,
        farmerId: req.farmerId,
        farmId: req.farmId,
        barangayId: req.barangayId,
        serviceType: req.serviceType,
        startAt: start,
        endAt: end,
        operatorId,
        status: "Scheduled",
        isHarvester,
        remarks: notes,
      });
      await db.update(equipment).set({ status: "Reserved" }).where(and(eq(equipment.id, req.equipmentId), eq(equipment.status, "Available")));
      if (operatorId) {
        const opRow = await db.select({ userId: operators.userId }).from(operators).where(eq(operators.id, operatorId)).limit(1);
        if (opRow[0]?.userId)
          await notify(opRow[0].userId, "assignment", "New field assignment", `You are assigned to ${req.code} on ${fmtRange(start, end)}.`, "/dashboard/assignments");
      }
    }
    await db
      .update(requests)
      .set({ status: "Approved", reviewNotes: notes, reviewedBy: user.id, reviewedAt: new Date(), requestedStart: start, requestedEnd: end })
      .where(eq(requests.id, requestId));
    if (targetUser)
      await notify(targetUser, "request", `Request ${req.code} approved`, `Your request is confirmed for ${fmtRange(start, end)}.`, "/dashboard/requests");
    await logAudit(user, "APPROVE", "Equipment Requests", req.code, `Approved and scheduled for ${fmtRange(start, end)}.`);
  } else if (decision === "reject") {
    await db
      .update(requests)
      .set({ status: "Rejected", reviewNotes: notes || "Rejected by MAO.", reviewedBy: user.id, reviewedAt: new Date() })
      .where(eq(requests.id, requestId));
    if (targetUser) await notify(targetUser, "request", `Request ${req.code} rejected`, notes || "Please contact the MAO for details.", "/dashboard/requests");
    await logAudit(user, "REJECT", "Equipment Requests", req.code, notes || "Rejected.");
  } else if (decision === "revise") {
    await db
      .update(requests)
      .set({ status: "Under Review", reviewNotes: notes || "Revision requested.", reviewedBy: user.id, reviewedAt: new Date() })
      .where(eq(requests.id, requestId));
    if (targetUser) await notify(targetUser, "request", `Revision requested for ${req.code}`, notes, "/dashboard/requests");
    await logAudit(user, "REVISE", "Equipment Requests", req.code, notes || "Requested revision.");
  }
  refresh();
}

export async function updateRequestStatusAction(fd: FormData) {
  const user = await requireUser();
  const requestId = n(fd, "requestId");
  const status = s(fd, "status");
  if (!requestId || !status) return;
  const rows = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  const req = rows[0];
  if (!req) return;
  if (!isMao(user.role) && req.farmerId !== user.farmerId) throw new Error("FORBIDDEN");

  await db
    .update(requests)
    .set({ status, completedAt: status === "Completed" ? new Date() : req.completedAt })
    .where(eq(requests.id, requestId));

  const resStatus = status === "Completed" ? "Completed" : status === "Cancelled" ? "Cancelled" : status === "In Progress" ? "In Progress" : null;
  if (resStatus) {
    await db.update(reservations).set({ status: resStatus }).where(eq(reservations.requestId, requestId));
    if (req.equipmentId) {
      const newEq = status === "In Progress" ? "In Use" : "Available";
      await db.update(equipment).set({ status: newEq }).where(eq(equipment.id, req.equipmentId));
    }
  }
  const targetUser = await farmerUserId(req.farmerId);
  if (targetUser) await notify(targetUser, "request", `Request ${req.code} — ${status}`, `Status updated to ${status}.`, "/dashboard/requests");
  await logAudit(user, "STATUS", "Equipment Requests", req.code, `Status set to ${status}.`);
  refresh();
}

/* --------------------------- reservations --------------------------- */

export async function scheduleActionsAction(fd: FormData) {
  const user = await requireUser();
  const id = n(fd, "reservationId");
  const op = s(fd, "op");
  if (!id) return;
  const rows = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  const res = rows[0];
  if (!res) return;

  if (op === "assign" && isMao(user.role)) {
    await db.update(reservations).set({ operatorId: n(fd, "operatorId") }).where(eq(reservations.id, id));
    await logAudit(user, "ASSIGN", "Scheduling", `RES-${id}`, "Operator assignment updated.");
  } else if (op === "reschedule" && isMao(user.role)) {
    const start = dt(fd, "startAt");
    const end = dt(fd, "endAt");
    if (start && end && end > start) {
      const clash = await reservationConflicts(res.equipmentId, start, end, id);
      if (clash.length) {
        await logAudit(user, "CONFLICT", "Scheduling", `RES-${id}`, "Reschedule blocked by conflict.");
        refresh();
        return;
      }
      await db.update(reservations).set({ startAt: start, endAt: end }).where(eq(reservations.id, id));
      if (res.requestId) await db.update(requests).set({ requestedStart: start, requestedEnd: end }).where(eq(requests.id, res.requestId));
      if (res.farmerId) {
        const u = await farmerUserId(res.farmerId);
        if (u) await notify(u, "schedule", "Schedule changed", `Your service was moved to ${fmtRange(start, end)}.`, "/dashboard/harvester");
      }
      await logAudit(user, "RESCHEDULE", "Scheduling", `RES-${id}`, `Moved to ${fmtRange(start, end)}.`);
    }
  } else if (op === "status") {
    const status = s(fd, "status", "Scheduled");
    await db.update(reservations).set({ status }).where(eq(reservations.id, id));
    if (res.requestId) {
      const map: Record<string, string> = { "In Progress": "In Progress", Completed: "Completed", Cancelled: "Cancelled", Scheduled: "Approved" };
      if (map[status]) {
        await db
          .update(requests)
          .set({ status: map[status], completedAt: status === "Completed" ? new Date() : null })
          .where(eq(requests.id, res.requestId));
      }
    }
    await db
      .update(equipment)
      .set({ status: status === "In Progress" ? "In Use" : status === "Scheduled" ? "Reserved" : "Available" })
      .where(eq(equipment.id, res.equipmentId));
    await logAudit(user, "STATUS", "Scheduling", `RES-${id}`, `Reservation status set to ${status}.`);
  }
  refresh();
}

/* ---------------------------- equipment ----------------------------- */

export async function saveEquipmentAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const values = {
    name: s(fd, "name"),
    categoryId: n(fd, "categoryId"),
    assetCode: s(fd, "assetCode"),
    description: s(fd, "description"),
    status: s(fd, "status", "Available"),
    condition: s(fd, "condition", "Good"),
    homeBarangayId: n(fd, "homeBarangayId"),
    location: s(fd, "location"),
    lat: s(fd, "lat") || null,
    lng: s(fd, "lng") || null,
    imageUrl: s(fd, "imageUrl"),
    defaultOperatorId: n(fd, "defaultOperatorId"),
    ratePerHa: s(fd, "ratePerHa", "0"),
    capacityNote: s(fd, "capacityNote"),
    nextMaintenanceDue: s(fd, "nextMaintenanceDue") || null,
    notes: s(fd, "notes"),
  };
  if (id) {
    await db.update(equipment).set(values).where(eq(equipment.id, id));
    await logAudit(user, "UPDATE", "Equipment", values.assetCode, `Updated ${values.name}.`);
  } else {
    await db.insert(equipment).values(values);
    await logAudit(user, "CREATE", "Equipment", values.assetCode, `Added ${values.name} to the inventory.`);
  }
  refresh();
}

export async function setEquipmentStatusAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const status = s(fd, "status");
  if (!id || !status) return;
  await db.update(equipment).set({ status }).where(eq(equipment.id, id));
  await logAudit(user, "UPDATE", "Equipment", `EQP-${id}`, `Status changed to ${status}.`);
  if (status === "Available") await notifyMao("equipment", "Equipment available", `Unit EQP-${id} is available again.`, "/dashboard/equipment");
  refresh();
}

export async function addMaintenanceAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role) && user.role !== "operator") throw new Error("FORBIDDEN");
  const equipmentId = n(fd, "equipmentId");
  if (!equipmentId) return;
  await db.insert(maintenanceRecords).values({
    equipmentId,
    serviceDate: s(fd, "serviceDate", new Date().toISOString().slice(0, 10)),
    type: s(fd, "type", "Preventive"),
    description: s(fd, "description"),
    cost: s(fd, "cost", "0"),
    nextDue: s(fd, "nextDue") || null,
    status: s(fd, "status", "Completed"),
    recordedBy: user.id,
  });
  if (s(fd, "status") === "In Progress") {
    await db.update(equipment).set({ status: "Under Maintenance" }).where(eq(equipment.id, equipmentId));
  }
  const due = s(fd, "nextDue");
  if (due) await db.update(equipment).set({ nextMaintenanceDue: due }).where(eq(equipment.id, equipmentId));
  await logAudit(user, "CREATE", "Maintenance", `EQP-${equipmentId}`, s(fd, "description") || "Maintenance logged.");
  refresh();
}

export async function saveResourceAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const values = {
    name: s(fd, "name"),
    type: s(fd, "type", "Service"),
    description: s(fd, "description"),
    unit: s(fd, "unit", "unit"),
    quantityTotal: n(fd, "quantityTotal") ?? 0,
    quantityAvailable: n(fd, "quantityAvailable") ?? 0,
    availability: s(fd, "availability", "Available"),
    notes: s(fd, "notes"),
  };
  if (id) await db.update(resources).set(values).where(eq(resources.id, id));
  else await db.insert(resources).values(values);
  await logAudit(user, id ? "UPDATE" : "CREATE", "Resources", values.name, "Shared resource record saved.");
  refresh();
}

/* --------------------------- announcements -------------------------- */

export async function saveAnnouncementAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const values = {
    title: s(fd, "title"),
    body: s(fd, "body"),
    category: s(fd, "category", "General Announcement"),
    priority: s(fd, "priority", "Normal"),
    audience: s(fd, "audience", "All Farmers"),
    barangayId: n(fd, "barangayId"),
    attachmentName: s(fd, "attachmentName"),
    publishAt: dt(fd, "publishAt") ?? new Date(),
    expiresAt: dt(fd, "expiresAt"),
    status: s(fd, "status", "Published"),
    createdBy: user.id,
  };
  if (id) {
    await db.update(announcements).set(values).where(eq(announcements.id, id));
    await logAudit(user, "UPDATE", "Announcements", `ANN-${id}`, `Updated “${values.title}”.`);
  } else {
    const inserted = await db.insert(announcements).values(values).returning({ id: announcements.id });
    await logAudit(user, values.status === "Published" ? "PUBLISH" : "CREATE", "Announcements", `ANN-${inserted[0].id}`, `${values.status} “${values.title}”.`);
    if (values.status === "Published") {
      const audience = await db.select({ id: users.id }).from(users).where(sql`${users.role} in ('farmer','association','barangay')`);
      for (const a of audience) await notify(a.id, "announcement", values.title, `${values.priority} · ${values.category}`, "/announcements");
    }
  }
  refresh();
}

export async function setAnnouncementStatusAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const status = s(fd, "status");
  if (!id || !status) return;
  await db.update(announcements).set({ status }).where(eq(announcements.id, id));
  await logAudit(user, status === "Archived" ? "ARCHIVE" : "PUBLISH", "Announcements", `ANN-${id}`, `Status set to ${status}.`);
  refresh();
}

export async function deleteAnnouncementAction(fd: FormData) {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  if (!id) return;
  await db.delete(announcementReads).where(eq(announcementReads.announcementId, id));
  await db.delete(announcements).where(eq(announcements.id, id));
  await logAudit(user, "DELETE", "Announcements", `ANN-${id}`, "Announcement deleted.");
  refresh();
}

export async function markAnnouncementReadAction(fd: FormData) {
  const user = await getCurrentUser();
  const id = n(fd, "id");
  if (!id) return;
  await db.update(announcements).set({ views: sql`${announcements.views} + 1` }).where(eq(announcements.id, id));
  if (user) {
    const existing = await db
      .select({ id: announcementReads.id })
      .from(announcementReads)
      .where(and(eq(announcementReads.announcementId, id), eq(announcementReads.userId, user.id)))
      .limit(1);
    if (!existing.length) await db.insert(announcementReads).values({ announcementId: id, userId: user.id });
  }
  refresh();
}

/* ------------------------------ meetings ---------------------------- */

export async function saveMeetingAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const start = dt(fd, "startAt") ?? new Date();
  const end = dt(fd, "endAt") ?? new Date(start.getTime() + 2 * 3600 * 1000);
  const values = {
    title: s(fd, "title"),
    startAt: start,
    endAt: end,
    venue: s(fd, "venue"),
    organizer: s(fd, "organizer", "Municipal Agriculture Office"),
    agenda: s(fd, "agenda"),
    description: s(fd, "description"),
    audience: s(fd, "audience", "All Farmers"),
    barangayId: n(fd, "barangayId"),
    status: s(fd, "status", "Upcoming"),
    attachmentName: s(fd, "attachmentName"),
    createdBy: user.id,
  };
  if (id) {
    await db.update(meetings).set(values).where(eq(meetings.id, id));
    await logAudit(user, "UPDATE", "Meetings", `MTG-${id}`, `Updated “${values.title}”.`);
  } else {
    const inserted = await db.insert(meetings).values(values).returning({ id: meetings.id });
    const meetingId = inserted[0].id;
    const invitees = await db.select({ id: users.id }).from(users).where(sql`${users.role} in ('farmer','association','barangay','operator')`);
    for (const inv of invitees) {
      await db.insert(meetingAttendance).values({ meetingId, userId: inv.id, status: "Invited" });
      await notify(inv.id, "meeting", `Meeting notice: ${values.title}`, `${values.venue} · ${fmtRange(start, end)}`, "/dashboard/meetings");
    }
    await logAudit(user, "CREATE", "Meetings", `MTG-${meetingId}`, `Created “${values.title}” with ${invitees.length} invitations.`);
  }
  refresh();
}

export async function meetingOpsAction(fd: FormData) {
  const user = await requireUser();
  const id = n(fd, "id");
  const op = s(fd, "op");
  if (!id) return;

  if (op === "rsvp") {
    const status = s(fd, "status", "Confirmed");
    const existing = await db
      .select({ id: meetingAttendance.id })
      .from(meetingAttendance)
      .where(and(eq(meetingAttendance.meetingId, id), eq(meetingAttendance.userId, user.id)))
      .limit(1);
    if (existing.length) {
      await db.update(meetingAttendance).set({ status, respondedAt: new Date() }).where(eq(meetingAttendance.id, existing[0].id));
    } else {
      await db.insert(meetingAttendance).values({ meetingId: id, userId: user.id, status, respondedAt: new Date() });
    }
    await logAudit(user, "RSVP", "Meetings", `MTG-${id}`, `Attendance response: ${status}.`);
  } else if (isMao(user.role)) {
    if (op === "status") {
      await db.update(meetings).set({ status: s(fd, "status", "Upcoming") }).where(eq(meetings.id, id));
      await logAudit(user, "STATUS", "Meetings", `MTG-${id}`, `Meeting marked ${s(fd, "status")}.`);
    } else if (op === "minutes") {
      await db.update(meetings).set({ minutes: s(fd, "minutes"), status: "Completed" }).where(eq(meetings.id, id));
      await logAudit(user, "UPDATE", "Meetings", `MTG-${id}`, "Minutes uploaded.");
    } else if (op === "attendance") {
      const attendanceId = n(fd, "attendanceId");
      if (attendanceId)
        await db.update(meetingAttendance).set({ status: s(fd, "status", "Attended"), respondedAt: new Date() }).where(eq(meetingAttendance.id, attendanceId));
      await logAudit(user, "UPDATE", "Meetings", `MTG-${id}`, "Attendance updated.");
    }
  }
  refresh();
}

/* ------------------------------ programs ---------------------------- */

export async function saveProgramAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const values = {
    title: s(fd, "title"),
    description: s(fd, "description"),
    eligibility: s(fd, "eligibility"),
    assistanceType: s(fd, "assistanceType", "Input Subsidy"),
    opensAt: s(fd, "opensAt") || null,
    deadline: s(fd, "deadline") || null,
    slots: n(fd, "slots") ?? 0,
    status: s(fd, "status", "Open"),
  };
  if (id) await db.update(programs).set(values).where(eq(programs.id, id));
  else await db.insert(programs).values(values);
  await logAudit(user, id ? "UPDATE" : "CREATE", "Programs", values.title, "Program record saved.");
  refresh();
}

export async function applyProgramAction(fd: FormData) {
  const user = await requireUser();
  if (!user.farmerId) throw new Error("FORBIDDEN");
  const programId = n(fd, "programId");
  if (!programId) return;
  const existing = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.programId, programId), eq(applications.farmerId, user.farmerId)))
    .limit(1);
  if (existing.length) return;
  await db.insert(applications).values({ programId, farmerId: user.farmerId, status: "Submitted", notes: s(fd, "notes") });
  await notify(user.id, "program", "Application submitted", "Your program application is now queued for MAO evaluation.", "/dashboard/programs");
  await notifyMao("program", "New program application", `${user.name} applied to a program.`, "/dashboard/programs");
  await logAudit(user, "CREATE", "Programs", `PRG-${programId}`, "Application submitted.");
  refresh();
}

export async function setApplicationStatusAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const status = s(fd, "status");
  if (!id || !status) return;
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  await db.update(applications).set({ status, notes: s(fd, "notes") }).where(eq(applications.id, id));
  if (rows[0]) {
    const u = await farmerUserId(rows[0].farmerId);
    if (u) await notify(u, "program", `Application ${status}`, s(fd, "notes") || `Your program application is now ${status}.`, "/dashboard/programs");
  }
  await logAudit(user, "STATUS", "Programs", `APP-${id}`, `Application ${status}.`);
  refresh();
}

/* -------------------------------- farms ----------------------------- */

export async function saveFarmAction(fd: FormData) {
  const user = await requireUser();
  const id = n(fd, "id");
  const farmerId = n(fd, "farmerId") ?? user.farmerId;
  if (!farmerId) throw new Error("FORBIDDEN");
  const values = {
    farmerId,
    barangayId: n(fd, "barangayId"),
    name: s(fd, "name"),
    crop: s(fd, "crop", "Rice"),
    areaHa: s(fd, "areaHa", "0"),
    lat: s(fd, "lat", "13.357800"),
    lng: s(fd, "lng", "121.100200"),
    landmark: s(fd, "landmark"),
    notes: s(fd, "notes"),
  };
  if (id) await db.update(farms).set(values).where(eq(farms.id, id));
  else await db.insert(farms).values(values);
  await logAudit(user, id ? "UPDATE" : "CREATE", "Farms", values.name, "Farm record saved.");
  refresh();
}

export async function deleteFarmAction(fd: FormData) {
  const user = await requireUser();
  const id = n(fd, "id");
  if (!id) return;
  const rows = await db.select().from(farms).where(eq(farms.id, id)).limit(1);
  if (!rows[0]) return;
  if (!isMao(user.role) && rows[0].farmerId !== user.farmerId) throw new Error("FORBIDDEN");
  await db.update(requests).set({ farmId: null }).where(eq(requests.farmId, id));
  await db.update(reservations).set({ farmId: null }).where(eq(reservations.farmId, id));
  await db.delete(farms).where(eq(farms.id, id));
  await logAudit(user, "DELETE", "Farms", `FRM-${id}`, "Farm record deleted.");
  refresh();
}

/* ------------------------------- profile ---------------------------- */

export async function updateProfileAction(fd: FormData) {
  const user = await requireUser();
  await db
    .update(users)
    .set({ name: s(fd, "name", user.name), phone: s(fd, "phone"), barangayId: n(fd, "barangayId") })
    .where(eq(users.id, user.id));
  if (user.farmerId) {
    await db
      .update(farmers)
      .set({
        rsbsaNumber: s(fd, "rsbsaNumber"),
        address: s(fd, "address"),
        mainCrop: s(fd, "mainCrop", "Rice"),
        preferredContact: s(fd, "preferredContact", "Mobile"),
        associationId: n(fd, "associationId"),
        barangayId: n(fd, "barangayId"),
        totalAreaHa: s(fd, "totalAreaHa", "0"),
      })
      .where(eq(farmers.id, user.farmerId));
  }
  await logAudit(user, "UPDATE", "Profile", `USR-${user.id}`, "Profile information updated.");
  refresh();
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = s(fd, "currentPassword");
  const next = s(fd, "newPassword");
  if (next.length < 6) return { error: "New password must be at least 6 characters." };
  const rows = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0] || !verifyPassword(current, rows[0].passwordHash)) return { error: "Current password is incorrect." };
  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, user.id));
  await logAudit(user, "UPDATE", "Authentication", `USR-${user.id}`, "Password changed.");
  refresh();
  return { success: "Password updated successfully." };
}

/* -------------------------- user management ------------------------- */

export async function saveUserAction(fd: FormData) {
  const admin = await requireUser();
  if (admin.role !== "admin") throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const base = {
    name: s(fd, "name"),
    email: s(fd, "email").toLowerCase(),
    phone: s(fd, "phone"),
    role: s(fd, "role", "farmer"),
    barangayId: n(fd, "barangayId"),
    status: s(fd, "status", "Active"),
  };
  if (id) {
    await db.update(users).set(base).where(eq(users.id, id));
    await logAudit(admin, "UPDATE", "User Management", `USR-${id}`, `Updated account ${base.email}.`);
  } else {
    const password = s(fd, "password", "agrishare123");
    const inserted = await db.insert(users).values({ ...base, passwordHash: hashPassword(password) }).returning({ id: users.id });
    if (base.role === "farmer") await db.insert(farmers).values({ userId: inserted[0].id, barangayId: base.barangayId });
    await logAudit(admin, "CREATE", "User Management", `USR-${inserted[0].id}`, `Created ${base.role} account ${base.email}.`);
  }
  refresh();
}

export async function toggleUserStatusAction(fd: FormData) {
  const admin = await requireUser();
  if (admin.role !== "admin") throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  if (!id || id === admin.id) return;
  const rows = await db.select({ status: users.status }).from(users).where(eq(users.id, id)).limit(1);
  const next = rows[0]?.status === "Active" ? "Deactivated" : "Active";
  await db.update(users).set({ status: next }).where(eq(users.id, id));
  await logAudit(admin, "UPDATE", "User Management", `USR-${id}`, `Account ${next.toLowerCase()}.`);
  refresh();
}

/* ---------------------------- notifications ------------------------- */

export async function markNotificationAction(fd: FormData) {
  const user = await requireUser();
  const id = n(fd, "id");
  if (id) {
    await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  } else {
    await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  }
  refresh();
}

/* ------------------------------ settings ---------------------------- */

export async function updateSettingsAction(fd: FormData) {
  const admin = await requireUser();
  if (admin.role !== "admin") throw new Error("FORBIDDEN");
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("setting_") || typeof value !== "string") continue;
    const settingKey = key.replace("setting_", "");
    await db.update(settings).set({ value }).where(eq(settings.key, settingKey));
  }
  await logAudit(admin, "UPDATE", "System Settings", "SETTINGS", "System settings updated.");
  refresh();
}

export async function saveMarketPriceAction(fd: FormData) {
  const user = await requireUser();
  if (!isMao(user.role)) throw new Error("FORBIDDEN");
  const id = n(fd, "id");
  const values = {
    crop: s(fd, "crop"),
    category: s(fd, "category", "Cereal"),
    market: s(fd, "market", "Baco Public Market"),
    unit: s(fd, "unit", "kg"),
    price: s(fd, "price", "0"),
    previousPrice: s(fd, "previousPrice", "0"),
    priceDate: s(fd, "priceDate", new Date().toISOString().slice(0, 10)),
    source: s(fd, "source", "MAO Baco Market Monitoring"),
    updatedAt: new Date(),
  };
  if (id) await db.update(marketPrices).set(values).where(eq(marketPrices.id, id));
  else await db.insert(marketPrices).values(values);
  await logAudit(user, id ? "UPDATE" : "CREATE", "Market Prices", values.crop, `Price set to ${values.price}/${values.unit}.`);
  refresh();
}
