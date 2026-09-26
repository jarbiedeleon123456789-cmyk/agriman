import "server-only";
import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  applications,
  associations,
  auditLogs,
  barangays,
  cropCalendar,
  equipment,
  equipmentCategories,
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
} from "@/db/mysql-schema";

export const ACTIVE_RESERVATION_STATUSES = ["Scheduled", "In Progress"];
export const OPEN_REQUEST_STATUSES = ["Submitted", "Under Review", "Approved", "Scheduled", "In Progress"];

/* ----------------------------- lookups ------------------------------ */

export async function listBarangays() {
  return db.select().from(barangays).orderBy(asc(barangays.name));
}

export async function listAssociations() {
  return db
    .select({
      id: associations.id,
      name: associations.name,
      acronym: associations.acronym,
      contactPerson: associations.contactPerson,
      contactNumber: associations.contactNumber,
      status: associations.status,
      barangay: barangays.name,
    })
    .from(associations)
    .leftJoin(barangays, eq(barangays.id, associations.barangayId))
    .orderBy(asc(associations.name));
}

export async function listCategories() {
  return db.select().from(equipmentCategories).orderBy(asc(equipmentCategories.categoryName));
}

export async function listOperators() {
  return db
    .select({
      id: operators.id,
      name: users.name,
      specialization: operators.specialization,
      availability: operators.availability,
      licenseNo: operators.licenseNo,
      phone: users.phone,
      userId: users.id,
    })
    .from(operators)
    .innerJoin(users, eq(users.id, operators.userId))
    .orderBy(asc(users.name));
}

export async function listResources() {
  return db.select().from(resources).orderBy(asc(resources.name));
}

export async function getSettings() {
  return db.select().from(settings).orderBy(asc(settings.group), asc(settings.id));
}

export async function settingsMap() {
  const rows = await getSettings();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

/* ---------------------------- equipment ----------------------------- */

export type EquipmentRow = Awaited<ReturnType<typeof listEquipment>>[number];

export async function listEquipment(filters?: { category?: string; status?: string; q?: string }) {
  const where = [];
  if (filters?.category && filters.category !== "all") where.push(eq(equipmentCategories.categoryName, filters.category));
  if (filters?.status && filters.status !== "all") where.push(eq(equipment.status, filters.status));
  if (filters?.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    where.push(
      or(sql`lower(${equipment.name}) like ${term}`, sql`lower(${equipment.assetCode}) like ${term}`)!,
    );
  }
  return db
    .select({
      id: equipment.id,
      name: equipment.name,
      assetCode: equipment.assetCode,
      description: equipment.description,
      status: equipment.status,
      condition: equipment.condition,
      location: equipment.location,
      imageUrl: equipment.imageUrl,
      ratePerHa: equipment.ratePerHa,
      capacityNote: equipment.capacityNote,
      nextMaintenanceDue: equipment.nextMaintenanceDue,
      lat: equipment.lat,
      lng: equipment.lng,
      notes: equipment.notes,
      categoryId: equipment.categoryId,
      category: equipmentCategories.categoryName,
      icon: equipmentCategories.icon,
      barangay: barangays.name,
      homeBarangayId: equipment.homeBarangayId,
      defaultOperatorId: equipment.defaultOperatorId,
    })
    .from(equipment)
    .leftJoin(equipmentCategories, eq(equipmentCategories.id, equipment.categoryId))
    .leftJoin(barangays, eq(barangays.id, equipment.homeBarangayId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(equipment.name));
}

export async function getEquipment(id: number) {
  const rows = await listEquipment();
  return rows.find((r) => r.id === id) ?? null;
}

export async function equipmentSchedule(equipmentId: number) {
  return db
    .select({
      id: reservations.id,
      startAt: reservations.startAt,
      endAt: reservations.endAt,
      status: reservations.status,
      serviceType: reservations.serviceType,
      barangay: barangays.name,
      farmer: users.name,
      operatorId: reservations.operatorId,
    })
    .from(reservations)
    .leftJoin(barangays, eq(barangays.id, reservations.barangayId))
    .leftJoin(farmers, eq(farmers.id, reservations.farmerId))
    .leftJoin(users, eq(users.id, farmers.userId))
    .where(eq(reservations.equipmentId, equipmentId))
    .orderBy(desc(reservations.startAt));
}

export async function maintenanceFor(equipmentId?: number) {
  return db
    .select({
      id: maintenanceRecords.id,
      equipmentId: maintenanceRecords.equipmentId,
      equipmentName: equipment.name,
      assetCode: equipment.assetCode,
      serviceDate: maintenanceRecords.serviceDate,
      type: maintenanceRecords.type,
      description: maintenanceRecords.description,
      cost: maintenanceRecords.cost,
      nextDue: maintenanceRecords.nextDue,
      status: maintenanceRecords.status,
    })
    .from(maintenanceRecords)
    .innerJoin(equipment, eq(equipment.id, maintenanceRecords.equipmentId))
    .where(equipmentId ? eq(maintenanceRecords.equipmentId, equipmentId) : undefined)
    .orderBy(desc(maintenanceRecords.serviceDate));
}

/* ----------------------- conflict detection ------------------------- */

export async function reservationConflicts(
  equipmentId: number,
  start: Date,
  end: Date,
  excludeReservationId?: number,
) {
  const where = [
    eq(reservations.equipmentId, equipmentId),
    inArray(reservations.status, ACTIVE_RESERVATION_STATUSES),
    lt(reservations.startAt, end),
    gt(reservations.endAt, start),
  ];
  if (excludeReservationId) where.push(ne(reservations.id, excludeReservationId));
  return db
    .select({
      id: reservations.id,
      startAt: reservations.startAt,
      endAt: reservations.endAt,
      status: reservations.status,
      farmer: users.name,
      barangay: barangays.name,
    })
    .from(reservations)
    .leftJoin(farmers, eq(farmers.id, reservations.farmerId))
    .leftJoin(users, eq(users.id, farmers.userId))
    .leftJoin(barangays, eq(barangays.id, reservations.barangayId))
    .where(and(...where));
}

export async function pendingRequestConflicts(equipmentId: number, start: Date, end: Date, excludeRequestId?: number) {
  const where = [
    eq(requests.equipmentId, equipmentId),
    inArray(requests.status, ["Submitted", "Under Review", "Approved"]),
    lt(requests.requestedStart, end),
    gt(requests.requestedEnd, start),
  ];
  if (excludeRequestId) where.push(ne(requests.id, excludeRequestId));
  return db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      start: requests.requestedStart,
      end: requests.requestedEnd,
      farmer: users.name,
    })
    .from(requests)
    .leftJoin(farmers, eq(farmers.id, requests.farmerId))
    .leftJoin(users, eq(users.id, farmers.userId))
    .where(and(...where));
}

/** Suggests the next free slots for a piece of equipment. */
export async function suggestSlots(equipmentId: number, from: Date, days = 14) {
  const booked = await db
    .select({ startAt: reservations.startAt, endAt: reservations.endAt })
    .from(reservations)
    .where(
      and(
        eq(reservations.equipmentId, equipmentId),
        inArray(reservations.status, ACTIVE_RESERVATION_STATUSES),
        gte(reservations.endAt, from),
      ),
    );
  const slots: { start: Date; end: Date }[] = [];
  for (let i = 1; i <= days && slots.length < 4; i++) {
    const start = new Date(from);
    start.setDate(start.getDate() + i);
    start.setHours(7, 0, 0, 0);
    const end = new Date(start);
    end.setHours(16, 0, 0, 0);
    const clash = booked.some((b) => start < new Date(b.endAt) && new Date(b.startAt) < end);
    if (!clash) slots.push({ start, end });
  }
  return slots;
}

/* ----------------------------- requests ----------------------------- */

export async function listRequests(filters?: { farmerId?: number; status?: string; barangayId?: number }) {
  const where = [];
  if (filters?.farmerId) where.push(eq(requests.farmerId, filters.farmerId));
  if (filters?.status && filters.status !== "all") where.push(eq(requests.status, filters.status));
  if (filters?.barangayId) where.push(eq(requests.barangayId, filters.barangayId));
  return db
    .select({
      id: requests.id,
      code: requests.code,
      status: requests.status,
      priority: requests.priority,
      serviceType: requests.serviceType,
      requestedStart: requests.requestedStart,
      requestedEnd: requests.requestedEnd,
      purpose: requests.purpose,
      cropType: requests.cropType,
      areaHa: requests.areaHa,
      notes: requests.notes,
      reviewNotes: requests.reviewNotes,
      reviewedAt: requests.reviewedAt,
      completedAt: requests.completedAt,
      createdAt: requests.createdAt,
      attachmentName: requests.attachmentName,
      equipmentId: requests.equipmentId,
      equipmentName: equipment.name,
      assetCode: equipment.assetCode,
      resourceId: requests.resourceId,
      resourceName: resources.name,
      farmerId: requests.farmerId,
      farmerName: users.name,
      farmerPhone: users.phone,
      farmName: farms.name,
      farmId: requests.farmId,
      barangay: barangays.name,
      barangayId: requests.barangayId,
    })
    .from(requests)
    .leftJoin(equipment, eq(equipment.id, requests.equipmentId))
    .leftJoin(resources, eq(resources.id, requests.resourceId))
    .leftJoin(farmers, eq(farmers.id, requests.farmerId))
    .leftJoin(users, eq(users.id, farmers.userId))
    .leftJoin(farms, eq(farms.id, requests.farmId))
    .leftJoin(barangays, eq(barangays.id, requests.barangayId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(requests.createdAt));
}

export async function getRequest(id: number) {
  const rows = await listRequests();
  return rows.find((r) => r.id === id) ?? null;
}

/* --------------------------- reservations --------------------------- */

export async function listReservations(filters?: {
  from?: Date;
  to?: Date;
  barangayId?: number;
  harvesterOnly?: boolean;
  operatorId?: number;
  farmerId?: number;
}) {
  const where = [];
  if (filters?.from) where.push(gte(reservations.endAt, filters.from));
  if (filters?.to) where.push(lte(reservations.startAt, filters.to));
  if (filters?.barangayId) where.push(eq(reservations.barangayId, filters.barangayId));
  if (filters?.harvesterOnly) where.push(eq(reservations.isHarvester, true));
  if (filters?.operatorId) where.push(eq(reservations.operatorId, filters.operatorId));
  if (filters?.farmerId) where.push(eq(reservations.farmerId, filters.farmerId));

  const operatorUser = users;
  return db
    .select({
      id: reservations.id,
      requestId: reservations.requestId,
      code: requests.code,
      equipmentId: reservations.equipmentId,
      equipmentName: equipment.name,
      assetCode: equipment.assetCode,
      startAt: reservations.startAt,
      endAt: reservations.endAt,
      status: reservations.status,
      serviceType: reservations.serviceType,
      isHarvester: reservations.isHarvester,
      remarks: reservations.remarks,
      operatorId: reservations.operatorId,
      operatorName: operatorUser.name,
      operatorPhone: operatorUser.phone,
      farmerId: reservations.farmerId,
      farmName: farms.name,
      farmLat: farms.lat,
      farmLng: farms.lng,
      farmCrop: farms.crop,
      areaHa: farms.areaHa,
      barangay: barangays.name,
      barangayId: reservations.barangayId,
    })
    .from(reservations)
    .leftJoin(equipment, eq(equipment.id, reservations.equipmentId))
    .leftJoin(requests, eq(requests.id, reservations.requestId))
    .leftJoin(operators, eq(operators.id, reservations.operatorId))
    .leftJoin(operatorUser, eq(operatorUser.id, operators.userId))
    .leftJoin(farms, eq(farms.id, reservations.farmId))
    .leftJoin(barangays, eq(barangays.id, reservations.barangayId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(reservations.startAt));
}

export async function reservationFarmerNames(ids: number[]) {
  if (!ids.length) return new Map<number, string>();
  const rows = await db
    .select({ id: farmers.id, name: users.name })
    .from(farmers)
    .innerJoin(users, eq(users.id, farmers.userId))
    .where(inArray(farmers.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}

/* ------------------------------ farmers ----------------------------- */

export async function listFarmers(q?: string) {
  const where = [];
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    where.push(or(sql`lower(${users.name}) like ${term}`, sql`lower(${farmers.rsbsaNumber}) like ${term}`)!);
  }
  return db
    .select({
      id: farmers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: farmers.status,
      rsbsaNumber: farmers.rsbsaNumber,
      address: farmers.address,
      gender: farmers.gender,
      mainCrop: farmers.mainCrop,
      totalAreaHa: farmers.totalAreaHa,
      preferredContact: farmers.preferredContact,
      barangay: barangays.name,
      barangayId: farmers.barangayId,
      association: associations.name,
      associationId: farmers.associationId,
      avatarEmoji: users.avatarEmoji,
      createdAt: farmers.createdAt,
    })
    .from(farmers)
    .innerJoin(users, eq(users.id, farmers.userId))
    .leftJoin(barangays, eq(barangays.id, farmers.barangayId))
    .leftJoin(associations, eq(associations.id, farmers.associationId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(users.name));
}

export async function getFarmerByUser(userId: number) {
  const rows = await db
    .select({
      id: farmers.id,
      userId: farmers.userId,
      rsbsaNumber: farmers.rsbsaNumber,
      address: farmers.address,
      gender: farmers.gender,
      mainCrop: farmers.mainCrop,
      totalAreaHa: farmers.totalAreaHa,
      preferredContact: farmers.preferredContact,
      barangayId: farmers.barangayId,
      associationId: farmers.associationId,
      status: farmers.status,
      barangay: barangays.name,
      association: associations.name,
    })
    .from(farmers)
    .leftJoin(barangays, eq(barangays.id, farmers.barangayId))
    .leftJoin(associations, eq(associations.id, farmers.associationId))
    .where(eq(farmers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listFarms(farmerId?: number) {
  return db
    .select({
      id: farms.id,
      farmerId: farms.farmerId,
      name: farms.name,
      crop: farms.crop,
      areaHa: farms.areaHa,
      lat: farms.lat,
      lng: farms.lng,
      landmark: farms.landmark,
      notes: farms.notes,
      barangay: barangays.name,
      barangayId: farms.barangayId,
      owner: users.name,
    })
    .from(farms)
    .leftJoin(barangays, eq(barangays.id, farms.barangayId))
    .leftJoin(farmers, eq(farmers.id, farms.farmerId))
    .leftJoin(users, eq(users.id, farmers.userId))
    .where(farmerId ? eq(farms.farmerId, farmerId) : undefined)
    .orderBy(asc(farms.name));
}

/* --------------------------- communication -------------------------- */

export async function listAnnouncements(opts?: { publicOnly?: boolean; category?: string; q?: string }) {
  const where = [];
  if (opts?.publicOnly) where.push(eq(announcements.status, "Published"));
  if (opts?.category && opts.category !== "all") where.push(eq(announcements.category, opts.category));
  if (opts?.q) {
    const term = `%${opts.q.toLowerCase()}%`;
    where.push(or(sql`lower(${announcements.title}) like ${term}`, sql`lower(${announcements.body}) like ${term}`)!);
  }
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      priority: announcements.priority,
      audience: announcements.audience,
      status: announcements.status,
      views: announcements.views,
      publishAt: announcements.publishAt,
      expiresAt: announcements.expiresAt,
      attachmentName: announcements.attachmentName,
      barangay: barangays.name,
      barangayId: announcements.barangayId,
      author: users.name,
    })
    .from(announcements)
    .leftJoin(barangays, eq(barangays.id, announcements.barangayId))
    .leftJoin(users, eq(users.id, announcements.createdBy))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(announcements.publishAt));
}

export async function listMeetings(opts?: { status?: string }) {
  const where = [];
  if (opts?.status && opts.status !== "all") where.push(eq(meetings.status, opts.status));
  return db
    .select({
      id: meetings.id,
      title: meetings.title,
      startAt: meetings.startAt,
      endAt: meetings.endAt,
      venue: meetings.venue,
      organizer: meetings.organizer,
      agenda: meetings.agenda,
      description: meetings.description,
      audience: meetings.audience,
      status: meetings.status,
      minutes: meetings.minutes,
      barangay: barangays.name,
      barangayId: meetings.barangayId,
    })
    .from(meetings)
    .leftJoin(barangays, eq(barangays.id, meetings.barangayId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(meetings.startAt));
}

export async function meetingAttendees(meetingId?: number) {
  return db
    .select({
      id: meetingAttendance.id,
      meetingId: meetingAttendance.meetingId,
      userId: meetingAttendance.userId,
      name: users.name,
      role: users.role,
      status: meetingAttendance.status,
      respondedAt: meetingAttendance.respondedAt,
    })
    .from(meetingAttendance)
    .innerJoin(users, eq(users.id, meetingAttendance.userId))
    .where(meetingId ? eq(meetingAttendance.meetingId, meetingId) : undefined)
    .orderBy(asc(users.name));
}

export async function listNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(60);
}

export async function unreadCount(userId: number) {
  const rows = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(rows[0]?.c ?? 0);
}

/* ---------------------------- programs ------------------------------ */

export async function listPrograms() {
  return db.select().from(programs).orderBy(desc(programs.opensAt));
}

export async function listApplications(farmerId?: number) {
  return db
    .select({
      id: applications.id,
      programId: applications.programId,
      programTitle: programs.title,
      farmerId: applications.farmerId,
      farmerName: users.name,
      status: applications.status,
      notes: applications.notes,
      submittedAt: applications.submittedAt,
      barangay: barangays.name,
    })
    .from(applications)
    .innerJoin(programs, eq(programs.id, applications.programId))
    .innerJoin(farmers, eq(farmers.id, applications.farmerId))
    .innerJoin(users, eq(users.id, farmers.userId))
    .leftJoin(barangays, eq(barangays.id, farmers.barangayId))
    .where(farmerId ? eq(applications.farmerId, farmerId) : undefined)
    .orderBy(desc(applications.submittedAt));
}

/* ------------------------ agri information -------------------------- */

export async function listMarketPrices() {
  return db.select().from(marketPrices).orderBy(asc(marketPrices.category), asc(marketPrices.crop));
}

export async function listCropCalendar() {
  return db.select().from(cropCalendar).orderBy(asc(cropCalendar.crop));
}

export async function listAuditLogs(limit = 100) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      avatarEmoji: users.avatarEmoji,
      createdAt: users.createdAt,
      barangay: barangays.name,
    })
    .from(users)
    .leftJoin(barangays, eq(barangays.id, users.barangayId))
    .orderBy(asc(users.role), asc(users.name));
}

/* ------------------------------ stats ------------------------------- */

async function c(query: Promise<{ c: number }[]>) {
  const rows = await query;
  return Number(rows[0]?.c ?? 0);
}

export async function platformStats() {
  const now = new Date();
  const [farmerCount, equipmentCount, availableCount, maintenanceCount, brgyCount, pending, approved, completed, upcoming, assocCount] =
    await Promise.all([
      c(db.select({ c: count() }).from(farmers)),
      c(db.select({ c: count() }).from(equipment)),
      c(db.select({ c: count() }).from(equipment).where(eq(equipment.status, "Available"))),
      c(db.select({ c: count() }).from(equipment).where(eq(equipment.status, "Under Maintenance"))),
      c(db.select({ c: count() }).from(barangays)),
      c(db.select({ c: count() }).from(requests).where(inArray(requests.status, ["Submitted", "Under Review"]))),
      c(db.select({ c: count() }).from(requests).where(eq(requests.status, "Approved"))),
      c(db.select({ c: count() }).from(requests).where(eq(requests.status, "Completed"))),
      c(
        db
          .select({ c: count() })
          .from(reservations)
          .where(and(gte(reservations.startAt, now), inArray(reservations.status, ACTIVE_RESERVATION_STATUSES))),
      ),
      c(db.select({ c: count() }).from(associations)),
    ]);
  return { farmerCount, equipmentCount, availableCount, maintenanceCount, brgyCount, pending, approved, completed, upcoming, assocCount };
}

export async function requestsByBarangay() {
  return db
    .select({ label: barangays.name, value: count() })
    .from(requests)
    .leftJoin(barangays, eq(barangays.id, requests.barangayId))
    .groupBy(barangays.name)
    .orderBy(desc(count()));
}

export async function requestsByEquipment() {
  return db
    .select({ label: equipment.name, value: count() })
    .from(requests)
    .innerJoin(equipment, eq(equipment.id, requests.equipmentId))
    .groupBy(equipment.name)
    .orderBy(desc(count()));
}

export async function requestsByStatus() {
  return db
    .select({ label: requests.status, value: count() })
    .from(requests)
    .groupBy(requests.status)
    .orderBy(desc(count()));
}

export async function monthlyRequestTrend() {
  const rows = await db
    .select({
      label: sql<string>`to_char(date_trunc('month', ${requests.createdAt}), 'Mon YYYY')`,
      bucket: sql<string>`date_trunc('month', ${requests.createdAt})`,
      value: count(),
    })
    .from(requests)
    .groupBy(sql`date_trunc('month', ${requests.createdAt})`)
    .orderBy(sql`date_trunc('month', ${requests.createdAt})`);
  return rows.map((r) => ({ label: r.label, value: Number(r.value) }));
}

export async function equipmentUtilization() {
  const rows = await db
    .select({
      label: equipment.name,
      value: sql<number>`coalesce(sum(extract(epoch from (${reservations.endAt} - ${reservations.startAt})) / 3600), 0)`,
    })
    .from(equipment)
    .leftJoin(reservations, and(eq(reservations.equipmentId, equipment.id), ne(reservations.status, "Cancelled")))
    .groupBy(equipment.name)
    .orderBy(desc(sql`coalesce(sum(extract(epoch from (${reservations.endAt} - ${reservations.startAt})) / 3600), 0)`));
  return rows.map((r) => ({ label: r.label, value: Math.round(Number(r.value)) }));
}

export async function farmersByBarangay() {
  const rows = await db
    .select({ label: barangays.name, value: count() })
    .from(farmers)
    .leftJoin(barangays, eq(barangays.id, farmers.barangayId))
    .groupBy(barangays.name)
    .orderBy(desc(count()));
  return rows.map((r) => ({ label: r.label ?? "Unassigned", value: Number(r.value) }));
}

/** Detects every overlapping pair of active reservations (data-integrity report). */
export async function schedulingConflicts() {
  const rows = await db
    .select({
      id: reservations.id,
      equipmentId: reservations.equipmentId,
      startAt: reservations.startAt,
      endAt: reservations.endAt,
      status: reservations.status,
      equipmentName: equipment.name,
      barangay: barangays.name,
    })
    .from(reservations)
    .leftJoin(equipment, eq(equipment.id, reservations.equipmentId))
    .leftJoin(barangays, eq(barangays.id, reservations.barangayId))
    .where(inArray(reservations.status, ACTIVE_RESERVATION_STATUSES))
    .orderBy(asc(reservations.startAt));

  const conflicts: { a: (typeof rows)[number]; b: (typeof rows)[number] }[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[i].equipmentId !== rows[j].equipmentId) continue;
      if (rows[i].startAt < rows[j].endAt && rows[j].startAt < rows[i].endAt) {
        conflicts.push({ a: rows[i], b: rows[j] });
      }
    }
  }
  return conflicts;
}

/** Pending requests that overlap with an existing confirmed reservation. */
export async function pendingConflicts() {
  const pending = await db
    .select({
      id: requests.id,
      code: requests.code,
      equipmentId: requests.equipmentId,
      start: requests.requestedStart,
      end: requests.requestedEnd,
      status: requests.status,
    })
    .from(requests)
    .where(and(inArray(requests.status, ["Submitted", "Under Review"]), sql`${requests.equipmentId} is not null`));

  const out: Record<number, { code: string; with: string; when: string }[]> = {};
  for (const p of pending) {
    if (!p.equipmentId) continue;
    const clash = await reservationConflicts(p.equipmentId, new Date(p.start), new Date(p.end));
    if (clash.length) {
      out[p.id] = clash.map((c2) => ({
        code: p.code,
        with: c2.farmer ?? "existing reservation",
        when: `${new Date(c2.startAt).toLocaleString("en-PH")} – ${new Date(c2.endAt).toLocaleTimeString("en-PH")}`,
      }));
    }
  }
  return out;
}
