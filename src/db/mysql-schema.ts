import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  decimal,
  json,
  date,
} from "drizzle-orm/mysql-core";

/* ------------------------------------------------------------------ */
/* MySQL / phpMyAdmin Schema for AgriShare                            */
/* Compatible with MySQL 5.7, 8.0+ and MariaDB 10.3+                  */
/* ------------------------------------------------------------------ */

export const roles = mysqlTable("roles", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  roleName: varchar("role_name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  permissions: json("permissions").$type<string[]>().notNull(),
});

export const barangays = mysqlTable("barangays", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  municipality: varchar("municipality", { length: 100 }).default("Baco").notNull(),
  province: varchar("province", { length: 100 }).default("Oriental Mindoro").notNull(),
  lat: decimal("lat", { precision: 10, scale: 6 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 6 }).notNull(),
  farmlandHa: decimal("farmland_ha", { precision: 10, scale: 2 }).default("0.00").notNull(),
});

export const associations = mysqlTable("associations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  acronym: varchar("acronym", { length: 50 }).default("").notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).default("").notNull(),
  contactNumber: varchar("contact_number", { length: 50 }).default("").notNull(),
  barangayId: int("barangay_id"),
  status: varchar("status", { length: 50 }).default("Active").notNull(),
});

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }).default("").notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("farmer").notNull(),
  barangayId: int("barangay_id"),
  status: varchar("status", { length: 50 }).default("Active").notNull(),
  avatarEmoji: varchar("avatar_emoji", { length: 10 }).default("🧑‍🌾").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farmers = mysqlTable("farmers", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  associationId: int("association_id"),
  barangayId: int("barangay_id"),
  rsbsaNumber: varchar("rsbsa_number", { length: 100 }).default("").notNull(),
  address: text("address").notNull(),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 20 }).default("").notNull(),
  preferredContact: varchar("preferred_contact", { length: 50 }).default("Mobile").notNull(),
  totalAreaHa: decimal("total_area_ha", { precision: 10, scale: 2 }).default("0.00").notNull(),
  mainCrop: varchar("main_crop", { length: 100 }).default("Rice").notNull(),
  status: varchar("status", { length: 50 }).default("Active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farms = mysqlTable("farms", {
  id: serial("id").primaryKey(),
  farmerId: int("farmer_id").notNull(),
  barangayId: int("barangay_id"),
  name: varchar("name", { length: 255 }).notNull(),
  crop: varchar("crop", { length: 100 }).default("Rice").notNull(),
  areaHa: decimal("area_ha", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lat: decimal("lat", { precision: 10, scale: 6 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 6 }).notNull(),
  landmark: text("landmark").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operators = mysqlTable("operators", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  specialization: varchar("specialization", { length: 255 }).default("Harvester Operator").notNull(),
  licenseNo: varchar("license_no", { length: 100 }).default("").notNull(),
  availability: varchar("availability", { length: 50 }).default("Available").notNull(),
  status: varchar("status", { length: 50 }).default("Active").notNull(),
});

export const equipmentCategories = mysqlTable("equipment_categories", {
  id: serial("id").primaryKey(),
  categoryName: varchar("category_name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 10 }).default("🚜").notNull(),
});

export const equipment = mysqlTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: int("category_id"),
  assetCode: varchar("asset_code", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).default("Available").notNull(),
  condition: varchar("condition", { length: 50 }).default("Good").notNull(),
  ownerOffice: varchar("owner_office", { length: 255 }).default("MAO Baco").notNull(),
  homeBarangayId: int("home_barangay_id"),
  location: varchar("location", { length: 255 }).default("MAO Motorpool, Baco").notNull(),
  lat: decimal("lat", { precision: 10, scale: 6 }),
  lng: decimal("lng", { precision: 10, scale: 6 }),
  imageUrl: text("image_url").notNull(),
  defaultOperatorId: int("default_operator_id"),
  ratePerHa: decimal("rate_per_ha", { precision: 10, scale: 2 }).default("0.00").notNull(),
  capacityNote: varchar("capacity_note", { length: 255 }).default("").notNull(),
  nextMaintenanceDue: date("next_maintenance_due"),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resources = mysqlTable("resources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).default("Service").notNull(),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 50 }).default("unit").notNull(),
  quantityTotal: int("quantity_total").default(0).notNull(),
  quantityAvailable: int("quantity_available").default(0).notNull(),
  availability: varchar("availability", { length: 50 }).default("Available").notNull(),
  notes: text("notes").notNull(),
});

export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: serial("id").primaryKey(),
  equipmentId: int("equipment_id").notNull(),
  serviceDate: date("service_date").notNull(),
  type: varchar("type", { length: 100 }).default("Preventive").notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0.00").notNull(),
  nextDue: date("next_due"),
  status: varchar("status", { length: 50 }).default("Completed").notNull(),
  recordedBy: int("recorded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const requests = mysqlTable("equipment_requests", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  farmerId: int("farmer_id").notNull(),
  equipmentId: int("equipment_id"),
  resourceId: int("resource_id"),
  farmId: int("farm_id"),
  barangayId: int("barangay_id"),
  serviceType: varchar("service_type", { length: 100 }).default("Harvesting").notNull(),
  requestedStart: timestamp("requested_start").notNull(),
  requestedEnd: timestamp("requested_end").notNull(),
  purpose: text("purpose").notNull(),
  cropType: varchar("crop_type", { length: 100 }).default("Rice").notNull(),
  areaHa: decimal("area_ha", { precision: 10, scale: 2 }).default("0.00").notNull(),
  priority: varchar("priority", { length: 50 }).default("Normal").notNull(),
  attachmentName: varchar("attachment_name", { length: 255 }).default("").notNull(),
  notes: text("notes").notNull(),
  status: varchar("status", { length: 50 }).default("Submitted").notNull(),
  reviewNotes: text("review_notes").notNull(),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reservations = mysqlTable("reservations", {
  id: serial("id").primaryKey(),
  requestId: int("request_id"),
  equipmentId: int("equipment_id").notNull(),
  farmerId: int("farmer_id"),
  farmId: int("farm_id"),
  barangayId: int("barangay_id"),
  serviceType: varchar("service_type", { length: 100 }).default("Harvesting").notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  operatorId: int("operator_id"),
  status: varchar("status", { length: 50 }).default("Scheduled").notNull(),
  isHarvester: boolean("is_harvester").default(false).notNull(),
  remarks: text("remarks").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waitlist = mysqlTable("waitlist", {
  id: serial("id").primaryKey(),
  requestId: int("request_id"),
  equipmentId: int("equipment_id"),
  farmerId: int("farmer_id"),
  preferredDate: date("preferred_date"),
  note: text("note").notNull(),
  status: varchar("status", { length: 50 }).default("Waiting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = mysqlTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 100 }).default("General Announcement").notNull(),
  priority: varchar("priority", { length: 50 }).default("Normal").notNull(),
  audience: varchar("audience", { length: 100 }).default("All Farmers").notNull(),
  barangayId: int("barangay_id"),
  associationId: int("association_id"),
  attachmentName: varchar("attachment_name", { length: 255 }).default("").notNull(),
  publishAt: timestamp("publish_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  status: varchar("status", { length: 50 }).default("Published").notNull(),
  views: int("views").default(0).notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcementReads = mysqlTable("announcement_reads", {
  id: serial("id").primaryKey(),
  announcementId: int("announcement_id").notNull(),
  userId: int("user_id").notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export const meetings = mysqlTable("meetings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  organizer: varchar("organizer", { length: 255 }).default("Municipal Agriculture Office").notNull(),
  agenda: text("agenda").notNull(),
  description: text("description").notNull(),
  audience: varchar("audience", { length: 100 }).default("All Farmers").notNull(),
  barangayId: int("barangay_id"),
  status: varchar("status", { length: 50 }).default("Upcoming").notNull(),
  minutes: text("minutes").notNull(),
  attachmentName: varchar("attachment_name", { length: 255 }).default("").notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingAttendance = mysqlTable("meeting_attendance", {
  id: serial("id").primaryKey(),
  meetingId: int("meeting_id").notNull(),
  userId: int("user_id").notNull(),
  status: varchar("status", { length: 50 }).default("Invited").notNull(),
  respondedAt: timestamp("responded_at"),
});

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  type: varchar("type", { length: 50 }).default("system").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 255 }).default("").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programs = mysqlTable("programs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  eligibility: text("eligibility").notNull(),
  assistanceType: varchar("assistance_type", { length: 100 }).default("Input Subsidy").notNull(),
  opensAt: date("opens_at"),
  deadline: date("deadline"),
  slots: int("slots").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("Open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applications = mysqlTable("applications", {
  id: serial("id").primaryKey(),
  programId: int("program_id").notNull(),
  farmerId: int("farmer_id").notNull(),
  status: varchar("status", { length: 50 }).default("Submitted").notNull(),
  notes: text("notes").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const marketPrices = mysqlTable("market_prices", {
  id: serial("id").primaryKey(),
  crop: varchar("crop", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).default("Cereal").notNull(),
  market: varchar("market", { length: 255 }).default("Baco Public Market").notNull(),
  unit: varchar("unit", { length: 50 }).default("kg").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  priceDate: date("price_date").notNull(),
  source: varchar("source", { length: 255 }).default("MAO Baco Market Monitoring").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cropCalendar = mysqlTable("crop_calendar", {
  id: serial("id").primaryKey(),
  crop: varchar("crop", { length: 100 }).notNull(),
  season: varchar("season", { length: 100 }).default("Wet Season").notNull(),
  plantingStart: varchar("planting_start", { length: 50 }).notNull(),
  plantingEnd: varchar("planting_end", { length: 50 }).notNull(),
  harvestStart: varchar("harvest_start", { length: 50 }).notNull(),
  harvestEnd: varchar("harvest_end", { length: 50 }).notNull(),
  durationDays: int("duration_days").default(110).notNull(),
  notes: text("notes").notNull(),
  advisory: text("advisory").notNull(),
});

export const weatherCache = mysqlTable("weather_cache", {
  id: serial("id").primaryKey(),
  location: varchar("location", { length: 255 }).notNull(),
  payload: json("payload").notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  userName: varchar("user_name", { length: 255 }).default("System").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 100 }).default("").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  group: varchar("group", { length: 100 }).default("General").notNull(),
});

export const plantDiagnoses = mysqlTable("plant_diagnoses", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  farmerName: varchar("farmer_name", { length: 255 }).default("Guest Farmer").notNull(),
  barangayId: int("barangay_id"),
  cropType: varchar("crop_type", { length: 100 }).notNull(),
  diseaseName: varchar("disease_name", { length: 255 }).notNull(),
  scientificName: varchar("scientific_name", { length: 255 }).default("").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("95.00").notNull(),
  severity: varchar("severity", { length: 50 }).default("Moderate").notNull(),
  imageUrl: text("image_url").notNull(),
  symptoms: json("symptoms").$type<string[]>().notNull(),
  causes: text("causes").notNull(),
  treatments: json("treatments").$type<{ organic: string[]; chemical: string[]; cultural: string[] }>().notNull(),
  prevention: text("prevention").notNull(),
  status: varchar("status", { length: 50 }).default("Pending Review").notNull(),
  technologistNotes: text("technologist_notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
