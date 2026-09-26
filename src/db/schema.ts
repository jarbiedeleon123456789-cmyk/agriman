import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  numeric,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Reference / organisation                                            */
/* ------------------------------------------------------------------ */

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  roleName: text("role_name").notNull(),
  description: text("description").default("").notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
});

export const barangays = pgTable("barangays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  municipality: text("municipality").default("Baco").notNull(),
  province: text("province").default("Oriental Mindoro").notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 6 }).notNull(),
  farmlandHa: numeric("farmland_ha", { precision: 10, scale: 2 }).default("0").notNull(),
});

export const associations = pgTable("associations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  acronym: text("acronym").default("").notNull(),
  contactPerson: text("contact_person").default("").notNull(),
  contactNumber: text("contact_number").default("").notNull(),
  barangayId: integer("barangay_id").references(() => barangays.id),
  status: text("status").default("Active").notNull(),
});

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").default("").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("farmer"), // admin | staff | farmer | association | barangay | operator | auditor
    barangayId: integer("barangay_id").references(() => barangays.id),
    status: text("status").default("Active").notNull(),
    avatarEmoji: text("avatar_emoji").default("🧑‍🌾").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const farmers = pgTable("farmers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  associationId: integer("association_id").references(() => associations.id),
  barangayId: integer("barangay_id").references(() => barangays.id),
  rsbsaNumber: text("rsbsa_number").default("").notNull(),
  address: text("address").default("").notNull(),
  birthDate: date("birth_date"),
  gender: text("gender").default("").notNull(),
  preferredContact: text("preferred_contact").default("Mobile").notNull(),
  totalAreaHa: numeric("total_area_ha", { precision: 10, scale: 2 }).default("0").notNull(),
  mainCrop: text("main_crop").default("Rice").notNull(),
  status: text("status").default("Active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").references(() => farmers.id).notNull(),
  barangayId: integer("barangay_id").references(() => barangays.id),
  name: text("name").notNull(),
  crop: text("crop").default("Rice").notNull(),
  areaHa: numeric("area_ha", { precision: 10, scale: 2 }).default("0").notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 6 }).notNull(),
  landmark: text("landmark").default("").notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  specialization: text("specialization").default("Harvester Operator").notNull(),
  licenseNo: text("license_no").default("").notNull(),
  availability: text("availability").default("Available").notNull(),
  status: text("status").default("Active").notNull(),
});

/* ------------------------------------------------------------------ */
/* Equipment & resources                                               */
/* ------------------------------------------------------------------ */

export const equipmentCategories = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  categoryName: text("category_name").notNull(),
  description: text("description").default("").notNull(),
  icon: text("icon").default("🚜").notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => equipmentCategories.id),
  assetCode: text("asset_code").notNull().unique(),
  description: text("description").default("").notNull(),
  status: text("status").default("Available").notNull(), // Available | Reserved | In Use | Under Maintenance | Unavailable | Retired
  condition: text("condition").default("Good").notNull(),
  ownerOffice: text("owner_office").default("MAO Baco").notNull(),
  homeBarangayId: integer("home_barangay_id").references(() => barangays.id),
  location: text("location").default("MAO Motorpool, Baco").notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  imageUrl: text("image_url").default("").notNull(),
  defaultOperatorId: integer("default_operator_id").references(() => operators.id),
  ratePerHa: numeric("rate_per_ha", { precision: 10, scale: 2 }).default("0").notNull(),
  capacityNote: text("capacity_note").default("").notNull(),
  nextMaintenanceDue: date("next_maintenance_due"),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").default("Service").notNull(),
  description: text("description").default("").notNull(),
  unit: text("unit").default("unit").notNull(),
  quantityTotal: integer("quantity_total").default(0).notNull(),
  quantityAvailable: integer("quantity_available").default(0).notNull(),
  availability: text("availability").default("Available").notNull(),
  notes: text("notes").default("").notNull(),
});

export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  serviceDate: date("service_date").notNull(),
  type: text("type").default("Preventive").notNull(),
  description: text("description").default("").notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  nextDue: date("next_due"),
  status: text("status").default("Completed").notNull(),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Requests / reservations / scheduling                                */
/* ------------------------------------------------------------------ */

export const requests = pgTable(
  "equipment_requests",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    farmerId: integer("farmer_id").references(() => farmers.id).notNull(),
    equipmentId: integer("equipment_id").references(() => equipment.id),
    resourceId: integer("resource_id").references(() => resources.id),
    farmId: integer("farm_id").references(() => farms.id),
    barangayId: integer("barangay_id").references(() => barangays.id),
    serviceType: text("service_type").default("Harvesting").notNull(),
    requestedStart: timestamp("requested_start", { withTimezone: true }).notNull(),
    requestedEnd: timestamp("requested_end", { withTimezone: true }).notNull(),
    purpose: text("purpose").default("").notNull(),
    cropType: text("crop_type").default("Rice").notNull(),
    areaHa: numeric("area_ha", { precision: 10, scale: 2 }).default("0").notNull(),
    priority: text("priority").default("Normal").notNull(),
    attachmentName: text("attachment_name").default("").notNull(),
    notes: text("notes").default("").notNull(),
    status: text("status").default("Submitted").notNull(),
    reviewNotes: text("review_notes").default("").notNull(),
    reviewedBy: integer("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("requests_status_idx").on(t.status)],
);

export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").references(() => requests.id),
    equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
    farmerId: integer("farmer_id").references(() => farmers.id),
    farmId: integer("farm_id").references(() => farms.id),
    barangayId: integer("barangay_id").references(() => barangays.id),
    serviceType: text("service_type").default("Harvesting").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    operatorId: integer("operator_id").references(() => operators.id),
    status: text("status").default("Scheduled").notNull(), // Scheduled | In Progress | Completed | Cancelled
    isHarvester: boolean("is_harvester").default(false).notNull(),
    remarks: text("remarks").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reservations_equipment_idx").on(t.equipmentId, t.startAt)],
);

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  farmerId: integer("farmer_id").references(() => farmers.id),
  preferredDate: date("preferred_date"),
  note: text("note").default("").notNull(),
  status: text("status").default("Waiting").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Communication                                                       */
/* ------------------------------------------------------------------ */

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").default("General Announcement").notNull(),
  priority: text("priority").default("Normal").notNull(), // Normal | Important | Urgent
  audience: text("audience").default("All Farmers").notNull(),
  barangayId: integer("barangay_id").references(() => barangays.id),
  associationId: integer("association_id").references(() => associations.id),
  attachmentName: text("attachment_name").default("").notNull(),
  publishAt: timestamp("publish_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: text("status").default("Published").notNull(), // Draft | Published | Scheduled | Archived
  views: integer("views").default(0).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const announcementReads = pgTable("announcement_reads", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").references(() => announcements.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  venue: text("venue").notNull(),
  organizer: text("organizer").default("Municipal Agriculture Office").notNull(),
  agenda: text("agenda").default("").notNull(),
  description: text("description").default("").notNull(),
  audience: text("audience").default("All Farmers").notNull(),
  barangayId: integer("barangay_id").references(() => barangays.id),
  status: text("status").default("Upcoming").notNull(), // Upcoming | Ongoing | Completed | Cancelled
  minutes: text("minutes").default("").notNull(),
  attachmentName: text("attachment_name").default("").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const meetingAttendance = pgTable("meeting_attendance", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").default("Invited").notNull(), // Invited | Confirmed | Attended | Absent
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").default("system").notNull(),
  title: text("title").notNull(),
  message: text("message").default("").notNull(),
  link: text("link").default("").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Programs & agricultural information                                 */
/* ------------------------------------------------------------------ */

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  eligibility: text("eligibility").default("").notNull(),
  assistanceType: text("assistance_type").default("Input Subsidy").notNull(),
  opensAt: date("opens_at"),
  deadline: date("deadline"),
  slots: integer("slots").default(0).notNull(),
  status: text("status").default("Open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  farmerId: integer("farmer_id").references(() => farmers.id).notNull(),
  status: text("status").default("Submitted").notNull(),
  notes: text("notes").default("").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

export const marketPrices = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  category: text("category").default("Cereal").notNull(),
  market: text("market").default("Baco Public Market").notNull(),
  unit: text("unit").default("kg").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  previousPrice: numeric("previous_price", { precision: 10, scale: 2 }).default("0").notNull(),
  priceDate: date("price_date").notNull(),
  source: text("source").default("MAO Baco Market Monitoring").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cropCalendar = pgTable("crop_calendar", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  season: text("season").default("Wet Season").notNull(),
  plantingStart: text("planting_start").notNull(),
  plantingEnd: text("planting_end").notNull(),
  harvestStart: text("harvest_start").notNull(),
  harvestEnd: text("harvest_end").notNull(),
  durationDays: integer("duration_days").default(110).notNull(),
  notes: text("notes").default("").notNull(),
  advisory: text("advisory").default("").notNull(),
});

export const weatherCache = pgTable("weather_cache", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  payload: jsonb("payload").notNull(),
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name").default("System").notNull(),
  action: text("action").notNull(),
  module: text("module").notNull(),
  recordId: text("record_id").default("").notNull(),
  details: text("details").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").default("").notNull(),
  label: text("label").default("").notNull(),
  group: text("group").default("General").notNull(),
});

export const plantDiagnoses = pgTable("plant_diagnoses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  farmerName: text("farmer_name").default("Guest Farmer").notNull(),
  barangayId: integer("barangay_id").references(() => barangays.id),
  cropType: text("crop_type").notNull(),
  diseaseName: text("disease_name").notNull(),
  scientificName: text("scientific_name").default("").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("95.00").notNull(),
  severity: text("severity").default("Moderate").notNull(), // Low | Moderate | Severe
  imageUrl: text("image_url").default("").notNull(),
  symptoms: jsonb("symptoms").$type<string[]>().default([]).notNull(),
  causes: text("causes").default("").notNull(),
  treatments: jsonb("treatments").$type<{ organic: string[]; chemical: string[]; cultural: string[] }>().notNull(),
  prevention: text("prevention").default("").notNull(),
  status: text("status").default("Pending Review").notNull(), // Pending Review | Verified by MAO | Resolved
  technologistNotes: text("technologist_notes").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
