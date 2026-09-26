import "server-only";
import { sql } from "drizzle-orm";
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
  plantDiagnoses,
  reservations,
  resources,
  roles,
  settings,
  users,
} from "@/db/mysql-schema";
import { hashPassword } from "@/lib/session";

let seedPromise: Promise<void> | null = null;

const IMG = {
  harvester:
    "https://images.pexels.com/photos/37395400/pexels-photo-37395400.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  harvester2:
    "https://images.pexels.com/photos/37395394/pexels-photo-37395394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  harvester3:
    "https://images.pexels.com/photos/10893497/pexels-photo-10893497.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tractor:
    "https://images.pexels.com/photos/34632627/pexels-photo-34632627.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tractor2:
    "https://images.pexels.com/photos/19030951/pexels-photo-19030951.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  field:
    "https://images.pexels.com/photos/35187052/pexels-photo-35187052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  machine:
    "https://images.pexels.com/photos/8977227/pexels-photo-8977227.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  crew: "https://images.pexels.com/photos/37412190/pexels-photo-37412190.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

function at(dayOffset: number, hour = 8, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

function dstr(dayOffset: number) {
  return at(dayOffset, 12);
}

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function runSeed() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  /* ------------------------------ roles ------------------------------ */
  await db.insert(roles).values([
    { code: "admin", roleName: "MAO Administrator", description: "Full administrative control.", permissions: ["*"] },
    { code: "staff", roleName: "MAO Staff / Coordinator", description: "Operational management.", permissions: ["requests.review", "equipment.manage", "schedule.manage", "content.manage"] },
    { code: "farmer", roleName: "Farmer", description: "Submit requests and view information.", permissions: ["requests.create", "profile.manage"] },
    { code: "association", roleName: "Association Officer", description: "Association-level coordination.", permissions: ["association.view", "requests.create"] },
    { code: "barangay", roleName: "Barangay Representative", description: "Barangay-level coordination.", permissions: ["barangay.view"] },
    { code: "operator", roleName: "Driver / Technician / Operator", description: "Field assignments.", permissions: ["assignments.view", "assignments.update"] },
    { code: "auditor", roleName: "System Auditor", description: "Read-only monitoring.", permissions: ["reports.view", "logs.view"] },
  ]);

  /* --------------------------- barangays ----------------------------- */
  await db
    .insert(barangays)
    .values([
      { name: "Poblacion", lat: "13.357800", lng: "121.100200", farmlandHa: "120.50" },
      { name: "Alag", lat: "13.401000", lng: "121.079000", farmlandHa: "480.00" },
      { name: "Bangkatan", lat: "13.372000", lng: "121.118000", farmlandHa: "260.75" },
      { name: "Baras", lat: "13.350600", lng: "121.107000", farmlandHa: "190.00" },
      { name: "Bayanan", lat: "13.335000", lng: "121.089000", farmlandHa: "310.20" },
      { name: "Burbuli", lat: "13.322000", lng: "121.132000", farmlandHa: "205.00" },
      { name: "Catwiran I", lat: "13.305000", lng: "121.155000", farmlandHa: "175.40" },
      { name: "Dulangan I", lat: "13.383000", lng: "121.141000", farmlandHa: "410.00" },
      { name: "Lumangbayan", lat: "13.365000", lng: "121.085000", farmlandHa: "225.60" },
      { name: "Malapad", lat: "13.344000", lng: "121.070000", farmlandHa: "150.00" },
      { name: "Mangangan I", lat: "13.398000", lng: "121.123000", farmlandHa: "345.30" },
      { name: "Mayabig", lat: "13.318000", lng: "121.095000", farmlandHa: "280.00" },
      { name: "Pulang-Tubig", lat: "13.390000", lng: "121.160000", farmlandHa: "198.75" },
      { name: "San Andres", lat: "13.331000", lng: "121.118000", farmlandHa: "265.10" },
      { name: "Santa Rosa I", lat: "13.412000", lng: "121.104000", farmlandHa: "390.00" },
      { name: "Silonay", lat: "13.369000", lng: "121.063000", farmlandHa: "140.00" },
      { name: "Tabon-tabon", lat: "13.310000", lng: "121.075000", farmlandHa: "215.90" },
    ]);
  const brgyRows = await db.select({ id: barangays.id, name: barangays.name }).from(barangays);

  const brgy = (name: string) => brgyRows.find((b) => b.name === name)!.id;

  /* -------------------------- associations --------------------------- */
  await db
    .insert(associations)
    .values([
      { name: "Baco Rice Farmers Association", acronym: "BRFA", contactPerson: "Rolando M. Dela Cruz", contactNumber: "0917-555-0101", barangayId: brgy("Poblacion") },
      { name: "Alag Irrigators Association", acronym: "AIA", contactPerson: "Melinda C. Reyes", contactNumber: "0918-555-0142", barangayId: brgy("Alag") },
      { name: "Mangangan Vegetable Growers", acronym: "MVG", contactPerson: "Jaime P. Villanueva", contactNumber: "0920-555-0177", barangayId: brgy("Mangangan I") },
      { name: "Bayanan Farmers Cooperative", acronym: "BFC", contactPerson: "Teresita L. Agbayani", contactNumber: "0916-555-0198", barangayId: brgy("Bayanan") },
      { name: "Dulangan Corn Producers Group", acronym: "DCPG", contactPerson: "Nestor G. Ramos", contactNumber: "0999-555-0123", barangayId: brgy("Dulangan I") },
    ]);
  const assocRows = await db.select({ id: associations.id, acronym: associations.acronym }).from(associations);

  const assoc = (acr: string) => assocRows.find((a) => a.acronym === acr)!.id;

  /* ------------------------------ users ------------------------------ */
  const pw = hashPassword("agrishare123");

  await db
    .insert(users)
    .values([
      { name: "Engr. Ramon T. Bautista", email: "admin@agrishare.gov.ph", phone: "0917-100-1001", passwordHash: pw, role: "admin", barangayId: brgy("Poblacion"), avatarEmoji: "👨‍💼" },
      { name: "Ma. Cristina L. Fajardo", email: "staff@agrishare.gov.ph", phone: "0917-100-1002", passwordHash: pw, role: "staff", barangayId: brgy("Poblacion"), avatarEmoji: "👩‍💻" },
      { name: "Arnel D. Manalo", email: "coordinator@agrishare.gov.ph", phone: "0917-100-1003", passwordHash: pw, role: "staff", barangayId: brgy("Poblacion"), avatarEmoji: "🧑‍💼" },
      { name: "Juan P. Dela Cruz", email: "farmer@agrishare.gov.ph", phone: "0917-200-2001", passwordHash: pw, role: "farmer", barangayId: brgy("Alag"), avatarEmoji: "🧑‍🌾" },
      { name: "Maria S. Santos", email: "maria.santos@agrishare.gov.ph", phone: "0917-200-2002", passwordHash: pw, role: "farmer", barangayId: brgy("Bayanan"), avatarEmoji: "👩‍🌾" },
      { name: "Pedro L. Villanueva", email: "pedro.villanueva@agrishare.gov.ph", phone: "0917-200-2003", passwordHash: pw, role: "farmer", barangayId: brgy("Mangangan I"), avatarEmoji: "🧑‍🌾" },
      { name: "Lorna B. Aguilar", email: "lorna.aguilar@agrishare.gov.ph", phone: "0917-200-2004", passwordHash: pw, role: "farmer", barangayId: brgy("Dulangan I"), avatarEmoji: "👩‍🌾" },
      { name: "Ricardo M. Gatchalian", email: "ricardo.g@agrishare.gov.ph", phone: "0917-200-2005", passwordHash: pw, role: "farmer", barangayId: brgy("San Andres"), avatarEmoji: "🧑‍🌾" },
      { name: "Anita R. Bituin", email: "anita.bituin@agrishare.gov.ph", phone: "0917-200-2006", passwordHash: pw, role: "farmer", barangayId: brgy("Santa Rosa I"), avatarEmoji: "👩‍🌾" },
      { name: "Rolando M. Dela Cruz", email: "association@agrishare.gov.ph", phone: "0917-300-3001", passwordHash: pw, role: "association", barangayId: brgy("Poblacion"), avatarEmoji: "🧑‍⚖️" },
      { name: "Kgd. Vilma O. Pastrana", email: "barangay@agrishare.gov.ph", phone: "0917-400-4001", passwordHash: pw, role: "barangay", barangayId: brgy("Alag"), avatarEmoji: "🏛️" },
      { name: "Danilo C. Estrada", email: "operator@agrishare.gov.ph", phone: "0917-500-5001", passwordHash: pw, role: "operator", barangayId: brgy("Poblacion"), avatarEmoji: "👷" },
      { name: "Marlon V. Sarmiento", email: "operator2@agrishare.gov.ph", phone: "0917-500-5002", passwordHash: pw, role: "operator", barangayId: brgy("Bayanan"), avatarEmoji: "👷" },
      { name: "Eduardo N. Lopez", email: "technician@agrishare.gov.ph", phone: "0917-500-5003", passwordHash: pw, role: "operator", barangayId: brgy("Poblacion"), avatarEmoji: "🔧" },
      { name: "COA Rep. Grace T. Morales", email: "auditor@agrishare.gov.ph", phone: "0917-600-6001", passwordHash: pw, role: "auditor", barangayId: brgy("Poblacion"), avatarEmoji: "🕵️" },
    ]);
  const userRows = await db.select({ id: users.id, email: users.email, name: users.name }).from(users);

  const usr = (email: string) => userRows.find((u) => u.email.startsWith(email))!.id;

  /* ---------------------------- operators ---------------------------- */
  await db
    .insert(operators)
    .values([
      { userId: usr("operator@"), specialization: "Combine Harvester Operator", licenseNo: "N02-15-004512", availability: "Available" },
      { userId: usr("operator2@"), specialization: "Tractor Operator / Driver", licenseNo: "N02-16-009821", availability: "On Assignment" },
      { userId: usr("technician@"), specialization: "Farm Machinery Technician", licenseNo: "TESDA-AFM-2291", availability: "Available" },
    ]);
  const opRows = await db.select({ id: operators.id, userId: operators.userId }).from(operators);

  const op = (i: number) => opRows[i].id;

  /* ----------------------------- farmers ----------------------------- */
  await db
    .insert(farmers)
    .values([
      { userId: usr("farmer@"), associationId: assoc("BRFA"), barangayId: brgy("Alag"), rsbsaNumber: "RSBSA-175-2019-00412", address: "Sitio Malaya, Alag, Baco", gender: "Male", totalAreaHa: "3.50", mainCrop: "Rice", preferredContact: "Mobile" },
      { userId: usr("maria.santos"), associationId: assoc("BFC"), barangayId: brgy("Bayanan"), rsbsaNumber: "RSBSA-175-2019-00518", address: "Purok 3, Bayanan, Baco", gender: "Female", totalAreaHa: "2.20", mainCrop: "Rice", preferredContact: "SMS" },
      { userId: usr("pedro.villanueva"), associationId: assoc("MVG"), barangayId: brgy("Mangangan I"), rsbsaNumber: "RSBSA-175-2020-00733", address: "Mangangan I, Baco", gender: "Male", totalAreaHa: "1.80", mainCrop: "Vegetables", preferredContact: "Mobile" },
      { userId: usr("lorna.aguilar"), associationId: assoc("DCPG"), barangayId: brgy("Dulangan I"), rsbsaNumber: "RSBSA-175-2018-00219", address: "Dulangan I, Baco", gender: "Female", totalAreaHa: "4.00", mainCrop: "Corn", preferredContact: "Mobile" },
      { userId: usr("ricardo.g"), associationId: assoc("BRFA"), barangayId: brgy("San Andres"), rsbsaNumber: "RSBSA-175-2021-00905", address: "San Andres, Baco", gender: "Male", totalAreaHa: "2.75", mainCrop: "Rice", preferredContact: "Barangay Office" },
      { userId: usr("anita.bituin"), associationId: assoc("AIA"), barangayId: brgy("Santa Rosa I"), rsbsaNumber: "RSBSA-175-2017-00108", address: "Santa Rosa I, Baco", gender: "Female", totalAreaHa: "5.10", mainCrop: "Rice", preferredContact: "Mobile" },
      { userId: usr("association@"), associationId: assoc("BRFA"), barangayId: brgy("Poblacion"), rsbsaNumber: "RSBSA-175-2016-00021", address: "Poblacion, Baco", gender: "Male", totalAreaHa: "6.00", mainCrop: "Rice", preferredContact: "Mobile" },
    ]);
  const farmerRows = await db.select({ id: farmers.id, userId: farmers.userId }).from(farmers);

  const frm = (email: string) => farmerRows.find((f) => f.userId === usr(email))!.id;

  /* ------------------------------ farms ------------------------------ */
  await db
    .insert(farms)
    .values([
      { farmerId: frm("farmer@"), barangayId: brgy("Alag"), name: "Dela Cruz Rice Field A", crop: "Rice (NSIC Rc222)", areaHa: "2.00", lat: "13.402400", lng: "121.080500", landmark: "Near Alag irrigation canal" },
      { farmerId: frm("farmer@"), barangayId: brgy("Alag"), name: "Dela Cruz Rice Field B", crop: "Rice (NSIC Rc160)", areaHa: "1.50", lat: "13.399100", lng: "121.076200", landmark: "Beside Alag Elementary School" },
      { farmerId: frm("maria.santos"), barangayId: brgy("Bayanan"), name: "Santos Family Farm", crop: "Rice (Hybrid)", areaHa: "2.20", lat: "13.336400", lng: "121.090800", landmark: "Purok 3 access road" },
      { farmerId: frm("pedro.villanueva"), barangayId: brgy("Mangangan I"), name: "Villanueva Vegetable Plot", crop: "Eggplant / Ampalaya", areaHa: "1.80", lat: "13.397200", lng: "121.124600", landmark: "Upland area, Mangangan I" },
      { farmerId: frm("lorna.aguilar"), barangayId: brgy("Dulangan I"), name: "Aguilar Corn Farm", crop: "Yellow Corn", areaHa: "4.00", lat: "13.384500", lng: "121.142800", landmark: "Dulangan river bank" },
      { farmerId: frm("ricardo.g"), barangayId: brgy("San Andres"), name: "Gatchalian Riceland", crop: "Rice (NSIC Rc216)", areaHa: "2.75", lat: "13.332100", lng: "121.119700", landmark: "San Andres barangay road" },
      { farmerId: frm("anita.bituin"), barangayId: brgy("Santa Rosa I"), name: "Bituin Farm North", crop: "Rice (NSIC Rc222)", areaHa: "3.10", lat: "13.413200", lng: "121.105400", landmark: "Sta. Rosa I service road" },
      { farmerId: frm("anita.bituin"), barangayId: brgy("Santa Rosa I"), name: "Bituin Farm South", crop: "Rice (NSIC Rc160)", areaHa: "2.00", lat: "13.410100", lng: "121.101900", landmark: "Near creek crossing" },
      { farmerId: frm("association@"), barangayId: brgy("Poblacion"), name: "BRFA Demo Farm", crop: "Rice (Certified Seeds)", areaHa: "6.00", lat: "13.356200", lng: "121.102900", landmark: "MAO demo area" },
    ].map((farm) => ({ notes: "", ...farm })));
  const farmRows = await db.select({ id: farms.id, name: farms.name }).from(farms);

  const farm = (name: string) => farmRows.find((f) => f.name === name)!.id;

  /* --------------------------- equipment ----------------------------- */
  await db
    .insert(equipmentCategories)
    .values([
      { categoryName: "Combine Harvester", description: "Self-propelled rice combine harvesters.", icon: "🌾" },
      { categoryName: "Tractor", description: "Four-wheel and hand tractors for land preparation.", icon: "🚜" },
      { categoryName: "Thresher", description: "Rice and corn threshing machines.", icon: "⚙️" },
      { categoryName: "Transport", description: "Hauling trucks and multicabs.", icon: "🛻" },
      { categoryName: "Post-Harvest", description: "Dryers, mills and post-harvest facilities.", icon: "🏭" },
      { categoryName: "Irrigation", description: "Water pumps and irrigation sets.", icon: "💧" },
    ]);
  const catRows = await db.select({ id: equipmentCategories.id, categoryName: equipmentCategories.categoryName }).from(equipmentCategories);

  const cat = (name: string) => catRows.find((c) => c.categoryName === name)!.id;

  await db
    .insert(equipment)
    .values([
      { name: "Kubota DC-70 Combine Harvester", categoryId: cat("Combine Harvester"), assetCode: "MAO-HRV-001", description: "70 HP rice combine harvester with 2.0 m cutting width. Ideal for 1–4 ha lowland rice fields.", status: "Available", condition: "Good", homeBarangayId: brgy("Poblacion"), location: "MAO Motorpool, Poblacion", lat: "13.357100", lng: "121.100900", imageUrl: IMG.harvester, defaultOperatorId: op(0), ratePerHa: "3500.00", capacityNote: "≈1.2 ha per day", nextMaintenanceDue: dstr(24) },
      { name: "Yanmar YH700 Combine Harvester", categoryId: cat("Combine Harvester"), assetCode: "MAO-HRV-002", description: "Track-type combine harvester assigned to the northern barangay cluster.", status: "Reserved", condition: "Good", homeBarangayId: brgy("Alag"), location: "Alag Barangay Motorpool", lat: "13.401600", lng: "121.079600", imageUrl: IMG.harvester2, defaultOperatorId: op(1), ratePerHa: "3500.00", capacityNote: "≈1.5 ha per day", nextMaintenanceDue: dstr(40) },
      { name: "World 504 Rice Combine Harvester", categoryId: cat("Combine Harvester"), assetCode: "MAO-HRV-003", description: "Municipal harvester for the southern cluster (Bayanan, Mayabig, Tabon-tabon).", status: "Under Maintenance", condition: "Needs Repair", homeBarangayId: brgy("Bayanan"), location: "MAO Service Bay", lat: "13.336000", lng: "121.089700", imageUrl: IMG.harvester3, defaultOperatorId: op(2), ratePerHa: "3200.00", capacityNote: "≈1.0 ha per day", nextMaintenanceDue: dstr(3) },
      { name: "Kubota M6040 Farm Tractor", categoryId: cat("Tractor"), assetCode: "MAO-TRC-001", description: "60 HP four-wheel drive tractor with rotavator for land preparation.", status: "Available", condition: "Excellent", homeBarangayId: brgy("Poblacion"), location: "MAO Motorpool, Poblacion", lat: "13.357400", lng: "121.101300", imageUrl: IMG.tractor, defaultOperatorId: op(1), ratePerHa: "2500.00", capacityNote: "≈2 ha per day", nextMaintenanceDue: dstr(15) },
      { name: "Massey Ferguson 4WD Tractor", categoryId: cat("Tractor"), assetCode: "MAO-TRC-002", description: "Heavy-duty tractor with disc plow and harrow attachments.", status: "In Use", condition: "Good", homeBarangayId: brgy("Dulangan I"), location: "Dulangan I field assignment", lat: "13.383800", lng: "121.141500", imageUrl: IMG.tractor2, defaultOperatorId: op(1), ratePerHa: "2800.00", capacityNote: "≈2.5 ha per day", nextMaintenanceDue: dstr(9) },
      { name: "Hand Tractor with Trailer", categoryId: cat("Tractor"), assetCode: "MAO-TRC-003", description: "Hand tractor unit for small upland plots and hauling.", status: "Available", condition: "Fair", homeBarangayId: brgy("Mangangan I"), location: "Mangangan I Barangay Hall", lat: "13.398500", lng: "121.123400", imageUrl: IMG.machine, ratePerHa: "1200.00", capacityNote: "≈0.5 ha per day", nextMaintenanceDue: dstr(55) },
      { name: "Axial Flow Rice Thresher", categoryId: cat("Thresher"), assetCode: "MAO-THR-001", description: "Portable axial flow thresher, 1.5 tons/hour capacity.", status: "Available", condition: "Good", homeBarangayId: brgy("Santa Rosa I"), location: "Sta. Rosa I Warehouse", lat: "13.412400", lng: "121.104800", imageUrl: IMG.field, ratePerHa: "900.00", capacityNote: "1.5 tons per hour", nextMaintenanceDue: dstr(31) },
      { name: "Corn Sheller Unit", categoryId: cat("Thresher"), assetCode: "MAO-THR-002", description: "Motorized corn sheller for the Dulangan corn cluster.", status: "Available", condition: "Good", homeBarangayId: brgy("Dulangan I"), location: "Dulangan I Warehouse", lat: "13.382600", lng: "121.140200", imageUrl: IMG.machine, ratePerHa: "800.00", capacityNote: "1 ton per hour", nextMaintenanceDue: dstr(48) },
      { name: "MAO Hauling Truck (6-wheeler)", categoryId: cat("Transport"), assetCode: "MAO-TRK-001", description: "Hauling truck for produce delivery and equipment transfer.", status: "Available", condition: "Good", homeBarangayId: brgy("Poblacion"), location: "MAO Motorpool, Poblacion", lat: "13.357000", lng: "121.100400", imageUrl: IMG.crew, defaultOperatorId: op(1), ratePerHa: "0.00", capacityNote: "4-ton capacity", nextMaintenanceDue: dstr(20) },
      { name: "Mechanical Flatbed Dryer", categoryId: cat("Post-Harvest"), assetCode: "MAO-PHF-001", description: "6-ton capacity flatbed dryer located at the MAO post-harvest facility.", status: "Available", condition: "Excellent", homeBarangayId: brgy("Poblacion"), location: "MAO Post-Harvest Facility", lat: "13.356600", lng: "121.099600", imageUrl: IMG.field, ratePerHa: "0.00", capacityNote: "6 tons per batch", nextMaintenanceDue: dstr(60) },
      { name: "Rice Mill Unit (Village Type)", categoryId: cat("Post-Harvest"), assetCode: "MAO-PHF-002", description: "Village-type rice mill shared by accredited associations.", status: "Available", condition: "Good", homeBarangayId: brgy("Baras"), location: "Baras Village Mill", lat: "13.350900", lng: "121.107600", imageUrl: IMG.machine, ratePerHa: "0.00", capacityNote: "500 kg per hour", nextMaintenanceDue: dstr(38) },
      { name: "4-inch Irrigation Water Pump", categoryId: cat("Irrigation"), assetCode: "MAO-IRR-001", description: "Diesel water pump set with 50 m hose for supplemental irrigation.", status: "Available", condition: "Good", homeBarangayId: brgy("Mayabig"), location: "Mayabig Barangay Hall", lat: "13.318500", lng: "121.095800", imageUrl: IMG.field, ratePerHa: "600.00", capacityNote: "4-inch discharge", nextMaintenanceDue: dstr(27) },
    ].map((item) => ({ notes: "", ...item })));
  const eqRows = await db.select({ id: equipment.id, assetCode: equipment.assetCode }).from(equipment);

  const eq = (code: string) => eqRows.find((e) => e.assetCode === code)!.id;

  await db.insert(resources).values([
    { name: "Certified Rice Seeds (NSIC Rc222)", type: "Farm Input", description: "Certified inbred rice seeds distributed per approved request.", unit: "bag (20kg)", quantityTotal: 400, quantityAvailable: 165, availability: "Available" },
    { name: "Organic Fertilizer", type: "Farm Input", description: "Vermicast-based organic fertilizer from the MAO composting facility.", unit: "sack (50kg)", quantityTotal: 600, quantityAvailable: 240, availability: "Available" },
    { name: "Soil Testing Service", type: "Service", description: "Soil sampling and analysis by MAO agricultural technologists.", unit: "sample", quantityTotal: 100, quantityAvailable: 74, availability: "Request-based" },
    { name: "Agricultural Extension Assistance", type: "Service", description: "On-farm technical assistance and farm visit by an assigned technologist.", unit: "visit", quantityTotal: 200, quantityAvailable: 158, availability: "Request-based" },
    { name: "Solar Dryer Pavement Use", type: "Facility", description: "Use of the barangay solar drying pavement (scheduled by batch).", unit: "slot", quantityTotal: 24, quantityAvailable: 9, availability: "Available" },
    { name: "Knapsack Sprayer Set", type: "Tool", description: "Manual and motorized knapsack sprayers for borrowing.", unit: "unit", quantityTotal: 30, quantityAvailable: 12, availability: "Available" },
  ].map((resource) => ({ notes: "", ...resource })));

  await db.insert(maintenanceRecords).values([
    { equipmentId: eq("MAO-HRV-001"), serviceDate: dstr(-35), type: "Preventive", description: "Change of engine oil, filters and blade sharpening after 120 hours of operation.", cost: "8500.00", nextDue: dstr(24), status: "Completed", recordedBy: usr("staff@") },
    { equipmentId: eq("MAO-HRV-003"), serviceDate: dstr(-4), type: "Corrective", description: "Replacement of damaged threshing drum bearing and belt. Unit temporarily unavailable.", cost: "15200.00", nextDue: dstr(3), status: "In Progress", recordedBy: usr("technician@") },
    { equipmentId: eq("MAO-TRC-001"), serviceDate: dstr(-18), type: "Preventive", description: "Hydraulic fluid top-up, tire pressure and brake inspection.", cost: "3200.00", nextDue: dstr(15), status: "Completed", recordedBy: usr("technician@") },
    { equipmentId: eq("MAO-TRC-002"), serviceDate: dstr(-60), type: "Preventive", description: "General tune-up before the land preparation season.", cost: "6400.00", nextDue: dstr(9), status: "Completed", recordedBy: usr("staff@") },
    { equipmentId: eq("MAO-THR-001"), serviceDate: dstr(-12), type: "Inspection", description: "Post-use inspection, no defects found.", cost: "0.00", nextDue: dstr(31), status: "Completed", recordedBy: usr("coordinator@") },
    { equipmentId: eq("MAO-TRK-001"), serviceDate: dstr(-25), type: "Preventive", description: "LTO registration renewal and brake pad replacement.", cost: "11800.00", nextDue: dstr(20), status: "Completed", recordedBy: usr("staff@") },
  ]);

  /* --------------------------- requests ------------------------------ */
  await db
    .insert(requests)
    .values([
      { code: "REQ-2601-0001", farmerId: frm("farmer@"), equipmentId: eq("MAO-HRV-001"), farmId: farm("Dela Cruz Rice Field A"), barangayId: brgy("Alag"), serviceType: "Harvesting", requestedStart: at(3, 7), requestedEnd: at(3, 15), purpose: "Harvesting of 2.0 ha mature rice (NSIC Rc222) before forecast rains.", cropType: "Rice", areaHa: "2.00", priority: "High", status: "Approved", reviewNotes: "Approved. Operator assigned. Please prepare the access road.", reviewedBy: usr("staff@"), reviewedAt: at(-1, 10), createdAt: at(-3, 9) },
      { code: "REQ-2601-0002", farmerId: frm("maria.santos"), equipmentId: eq("MAO-HRV-001"), farmId: farm("Santos Family Farm"), barangayId: brgy("Bayanan"), serviceType: "Harvesting", requestedStart: at(3, 10), requestedEnd: at(3, 17), purpose: "Harvest assistance for 2.2 ha hybrid rice.", cropType: "Rice", areaHa: "2.20", priority: "Normal", status: "Under Review", notes: "Requesting morning schedule if possible.", createdAt: at(-1, 14) },
      { code: "REQ-2601-0003", farmerId: frm("lorna.aguilar"), equipmentId: eq("MAO-TRC-002"), farmId: farm("Aguilar Corn Farm"), barangayId: brgy("Dulangan I"), serviceType: "Land Preparation", requestedStart: at(1, 7), requestedEnd: at(1, 16), purpose: "Plowing and harrowing of 4 ha corn area for the next cropping.", cropType: "Corn", areaHa: "4.00", priority: "Normal", status: "In Progress", reviewNotes: "Approved and currently on-going.", reviewedBy: usr("admin@"), reviewedAt: at(-2, 8), createdAt: at(-5, 11) },
      { code: "REQ-2601-0004", farmerId: frm("anita.bituin"), equipmentId: eq("MAO-HRV-002"), farmId: farm("Bituin Farm North"), barangayId: brgy("Santa Rosa I"), serviceType: "Harvesting", requestedStart: at(5, 7), requestedEnd: at(5, 16), purpose: "Harvest of 3.1 ha rice field, Sta. Rosa I cluster.", cropType: "Rice", areaHa: "3.10", priority: "Normal", status: "Approved", reviewNotes: "Approved, coordinate with barangay for road access.", reviewedBy: usr("staff@"), reviewedAt: at(-1, 15), createdAt: at(-4, 8) },
      { code: "REQ-2601-0005", farmerId: frm("ricardo.g"), equipmentId: eq("MAO-THR-001"), farmId: farm("Gatchalian Riceland"), barangayId: brgy("San Andres"), serviceType: "Threshing", requestedStart: at(2, 8), requestedEnd: at(2, 14), purpose: "Threshing of harvested palay, approx. 6 tons.", cropType: "Rice", areaHa: "2.75", priority: "Normal", status: "Submitted", createdAt: at(0, 7) },
      { code: "REQ-2601-0006", farmerId: frm("pedro.villanueva"), equipmentId: eq("MAO-TRC-003"), farmId: farm("Villanueva Vegetable Plot"), barangayId: brgy("Mangangan I"), serviceType: "Land Preparation", requestedStart: at(4, 7), requestedEnd: at(4, 12), purpose: "Land preparation for eggplant and ampalaya planting.", cropType: "Vegetables", areaHa: "1.80", priority: "Normal", status: "Submitted", createdAt: at(0, 9) },
      { code: "REQ-2601-0007", farmerId: frm("farmer@"), equipmentId: eq("MAO-TRC-001"), farmId: farm("Dela Cruz Rice Field B"), barangayId: brgy("Alag"), serviceType: "Land Preparation", requestedStart: at(-12, 7), requestedEnd: at(-12, 16), purpose: "Land preparation of 1.5 ha.", cropType: "Rice", areaHa: "1.50", priority: "Normal", status: "Completed", reviewNotes: "Service completed, 1.5 ha covered.", reviewedBy: usr("staff@"), reviewedAt: at(-15, 9), completedAt: at(-12, 17), createdAt: at(-18, 10) },
      { code: "REQ-2601-0008", farmerId: frm("maria.santos"), equipmentId: eq("MAO-HRV-003"), farmId: farm("Santos Family Farm"), barangayId: brgy("Bayanan"), serviceType: "Harvesting", requestedStart: at(-2, 7), requestedEnd: at(-2, 15), purpose: "Harvesting request during harvester breakdown.", cropType: "Rice", areaHa: "2.20", priority: "High", status: "Rejected", reviewNotes: "Rejected: unit MAO-HRV-003 is under corrective maintenance. Please re-file using MAO-HRV-001.", reviewedBy: usr("admin@"), reviewedAt: at(-2, 9), createdAt: at(-6, 16) },
      { code: "REQ-2601-0009", farmerId: frm("association@"), resourceId: 1, barangayId: brgy("Poblacion"), serviceType: "Farm Input", requestedStart: at(6, 8), requestedEnd: at(6, 12), purpose: "Request for 40 bags of certified rice seeds for BRFA members.", cropType: "Rice", areaHa: "20.00", priority: "High", status: "Under Review", createdAt: at(-1, 10) },
      { code: "REQ-2601-0010", farmerId: frm("anita.bituin"), equipmentId: eq("MAO-PHF-001"), barangayId: brgy("Santa Rosa I"), serviceType: "Drying", requestedStart: at(7, 8), requestedEnd: at(7, 18), purpose: "Mechanical drying of 5 tons freshly harvested palay.", cropType: "Rice", areaHa: "3.10", priority: "Normal", status: "Approved", reviewNotes: "Approved, batch 2 slot.", reviewedBy: usr("coordinator@"), reviewedAt: at(0, 8), createdAt: at(-2, 13) },
      { code: "REQ-2601-0011", farmerId: frm("ricardo.g"), equipmentId: eq("MAO-HRV-001"), farmId: farm("Gatchalian Riceland"), barangayId: brgy("San Andres"), serviceType: "Harvesting", requestedStart: at(9, 7), requestedEnd: at(9, 15), purpose: "Scheduled harvest, 2.75 ha.", cropType: "Rice", areaHa: "2.75", priority: "Normal", status: "Approved", reviewNotes: "Approved.", reviewedBy: usr("staff@"), reviewedAt: at(0, 9), createdAt: at(-1, 8) },
      { code: "REQ-2601-0012", farmerId: frm("pedro.villanueva"), equipmentId: eq("MAO-IRR-001"), farmId: farm("Villanueva Vegetable Plot"), barangayId: brgy("Mangangan I"), serviceType: "Irrigation Support", requestedStart: at(-20, 7), requestedEnd: at(-20, 12), purpose: "Supplemental irrigation during dry spell.", cropType: "Vegetables", areaHa: "1.80", priority: "Normal", status: "Completed", reviewedBy: usr("staff@"), reviewedAt: at(-22, 9), completedAt: at(-20, 13), createdAt: at(-24, 15) },
    ].map((request) => ({ notes: "", reviewNotes: "", ...request })));
  const reqRows = await db.select({ id: requests.id, code: requests.code }).from(requests);

  const req = (code: string) => reqRows.find((r) => r.code === code)!.id;

  await db.insert(reservations).values([
    { requestId: req("REQ-2601-0001"), equipmentId: eq("MAO-HRV-001"), farmerId: frm("farmer@"), farmId: farm("Dela Cruz Rice Field A"), barangayId: brgy("Alag"), serviceType: "Harvesting", startAt: at(3, 7), endAt: at(3, 15), operatorId: op(0), status: "Scheduled", isHarvester: true, remarks: "Bring extra fuel; field is 2 km from main road." },
    { requestId: req("REQ-2601-0003"), equipmentId: eq("MAO-TRC-002"), farmerId: frm("lorna.aguilar"), farmId: farm("Aguilar Corn Farm"), barangayId: brgy("Dulangan I"), serviceType: "Land Preparation", startAt: at(1, 7), endAt: at(1, 16), operatorId: op(1), status: "In Progress", isHarvester: false, remarks: "Ongoing plowing operation." },
    { requestId: req("REQ-2601-0004"), equipmentId: eq("MAO-HRV-002"), farmerId: frm("anita.bituin"), farmId: farm("Bituin Farm North"), barangayId: brgy("Santa Rosa I"), serviceType: "Harvesting", startAt: at(5, 7), endAt: at(5, 16), operatorId: op(1), status: "Scheduled", isHarvester: true, remarks: "Coordinate with Sta. Rosa I barangay council." },
    { requestId: req("REQ-2601-0010"), equipmentId: eq("MAO-PHF-001"), farmerId: frm("anita.bituin"), barangayId: brgy("Santa Rosa I"), serviceType: "Drying", startAt: at(7, 8), endAt: at(7, 18), status: "Scheduled", isHarvester: false, remarks: "Batch 2 drying slot." },
    { requestId: req("REQ-2601-0011"), equipmentId: eq("MAO-HRV-001"), farmerId: frm("ricardo.g"), farmId: farm("Gatchalian Riceland"), barangayId: brgy("San Andres"), serviceType: "Harvesting", startAt: at(9, 7), endAt: at(9, 15), operatorId: op(0), status: "Scheduled", isHarvester: true, remarks: "" },
    { requestId: req("REQ-2601-0007"), equipmentId: eq("MAO-TRC-001"), farmerId: frm("farmer@"), farmId: farm("Dela Cruz Rice Field B"), barangayId: brgy("Alag"), serviceType: "Land Preparation", startAt: at(-12, 7), endAt: at(-12, 16), operatorId: op(1), status: "Completed", isHarvester: false, remarks: "Completed 1.5 ha." },
    { requestId: req("REQ-2601-0012"), equipmentId: eq("MAO-IRR-001"), farmerId: frm("pedro.villanueva"), farmId: farm("Villanueva Vegetable Plot"), barangayId: brgy("Mangangan I"), serviceType: "Irrigation Support", startAt: at(-20, 7), endAt: at(-20, 12), status: "Completed", isHarvester: false, remarks: "" },
    { equipmentId: eq("MAO-HRV-002"), farmerId: frm("maria.santos"), farmId: farm("Santos Family Farm"), barangayId: brgy("Bayanan"), serviceType: "Harvesting", startAt: at(12, 7), endAt: at(12, 15), operatorId: op(1), status: "Scheduled", isHarvester: true, remarks: "Tentative cluster schedule." },
  ]);

  /* ------------------------- announcements --------------------------- */
  await db.insert(announcements).values([
    { title: "Harvester Deployment Schedule for the Northern Barangay Cluster", body: "The Municipal Agriculture Office announces the deployment schedule of the Kubota DC-70 and Yanmar YH700 combine harvesters for Alag, Santa Rosa I, Mangangan I and Dulangan I.\n\nFarmers with approved requests are advised to prepare field access roads and to be present during the scheduled service. Requests may still be filed through the AgriShare portal; conflicting schedules will automatically be flagged for review by MAO personnel.", category: "Equipment Notice", priority: "Important", audience: "All Farmers", publishAt: at(-1, 8), expiresAt: at(20, 17), status: "Published", views: 148, createdBy: usr("staff@") },
    { title: "Weather Advisory: Southwest Monsoon Enhanced by LPA", body: "PAGASA reports an enhanced southwest monsoon affecting Oriental Mindoro within the next 72 hours. Moderate to heavy rains are expected.\n\nFarmers with standing mature palay are urged to coordinate with the MAO for priority harvesting assistance. Please secure harvested produce in covered storage and avoid drying palay on roadsides.", category: "Weather Warning", priority: "Urgent", audience: "All Farmers", publishAt: at(0, 6), expiresAt: at(4, 18), status: "Published", views: 320, createdBy: usr("admin@") },
    { title: "Availability of Certified Rice Seeds under the Rice Competitiveness Enhancement Fund", body: "Certified inbred rice seeds (NSIC Rc222, Rc160 and Rc216) are now available at the MAO warehouse for registered RSBSA farmers.\n\nAllocation: two (2) bags per hectare, maximum of six (6) bags per farmer. Bring your RSBSA ID and barangay certification.", category: "Program", priority: "Important", audience: "All Farmers", publishAt: at(-3, 9), expiresAt: at(25, 17), status: "Published", views: 210, createdBy: usr("coordinator@") },
    { title: "Barangay Alag Farmers Orientation on AgriShare Portal", body: "An orientation on the use of the AgriShare resource-sharing and scheduling platform will be conducted for Barangay Alag farmers. Bring your mobile phone and RSBSA number for account registration assistance.", category: "Meeting", priority: "Normal", audience: "Selected Barangay", barangayId: brgy("Alag"), publishAt: at(-2, 10), expiresAt: at(10, 17), status: "Published", views: 74, createdBy: usr("staff@") },
    { title: "Temporary Unavailability of World 504 Combine Harvester", body: "Unit MAO-HRV-003 is under corrective maintenance due to a damaged threshing drum bearing. Estimated return to service is within three (3) days.\n\nAffected requests have been re-routed to available units. Farmers may check unit availability in real time through the Equipment page.", category: "Equipment Notice", priority: "Important", audience: "All Farmers", publishAt: at(-4, 13), expiresAt: at(6, 17), status: "Published", views: 96, createdBy: usr("technician@") },
    { title: "Agricultural Advisory: Rat Infestation Monitoring in Lowland Rice Areas", body: "Field reports indicate increasing rodent activity in lowland rice areas of Bayanan and San Andres. Community-wide trapping and synchronized planting are recommended.\n\nMAO technologists are available for farm visits upon request through the Farmer Services page.", category: "Agriculture Advisory", priority: "Normal", audience: "All Farmers", publishAt: at(-6, 8), expiresAt: at(15, 17), status: "Published", views: 130, createdBy: usr("coordinator@") },
    { title: "Schedule Change: Post-Harvest Facility Drying Slots", body: "Drying slots at the MAO post-harvest facility will follow a two-batch system (8:00 AM and 1:00 PM) starting next week to accommodate more farmers during peak harvest.", category: "Schedule Change", priority: "Normal", audience: "All Farmers", publishAt: at(1, 8), expiresAt: at(30, 17), status: "Scheduled", views: 0, createdBy: usr("staff@") },
    { title: "Completed: Distribution of Organic Fertilizer for Vegetable Growers", body: "The distribution of vermicast-based organic fertilizer for the Mangangan Vegetable Growers has been completed. Thank you to all participating farmers.", category: "General Announcement", priority: "Normal", audience: "Selected Association", associationId: assoc("MVG"), publishAt: at(-40, 9), expiresAt: at(-10, 17), status: "Archived", views: 58, createdBy: usr("coordinator@") },
  ]);

  /* ----------------------------- meetings ---------------------------- */
  await db
    .insert(meetings)
    .values([
      { title: "Municipal Farmers Coordination Meeting", startAt: at(4, 9), endAt: at(4, 11, 30), venue: "MAO Conference Room, Baco Municipal Hall", organizer: "Municipal Agriculture Office", agenda: "1. Harvest season readiness\n2. Equipment scheduling policy\n3. AgriShare portal roll-out\n4. Other matters", description: "Quarterly coordination meeting with all accredited farmers' associations.", audience: "All Farmers", status: "Upcoming", createdBy: usr("admin@") },
      { title: "Barangay Alag Irrigators Association Assembly", startAt: at(8, 14), endAt: at(8, 16), venue: "Alag Barangay Hall", organizer: "Alag Irrigators Association", agenda: "1. Canal cleaning schedule\n2. Water distribution during dry spell\n3. Harvester queue for Alag cluster", description: "Assembly of AIA members with MAO technical staff.", audience: "Selected Barangay", barangayId: brgy("Alag"), status: "Upcoming", createdBy: usr("staff@") },
      { title: "Equipment Operators Safety Briefing", startAt: at(2, 8), endAt: at(2, 10), venue: "MAO Motorpool, Poblacion", organizer: "MAO Equipment Section", agenda: "1. Pre-operation checklist\n2. Field safety protocol\n3. Maintenance reporting through AgriShare", description: "Mandatory briefing for all MAO drivers, operators and technicians.", audience: "Operators", status: "Upcoming", createdBy: usr("coordinator@") },
      { title: "Corn Cluster Production Planning (Dulangan)", startAt: at(-9, 9), endAt: at(-9, 11), venue: "Dulangan I Multi-Purpose Hall", organizer: "MAO Crop Production Section", agenda: "1. Cropping calendar\n2. Sheller scheduling\n3. Buyer linkage", description: "Planning session with the Dulangan Corn Producers Group.", audience: "Selected Association", status: "Completed", minutes: "The group agreed on a synchronized planting window and requested two additional sheller deployment days per month. MAO committed to prioritize corn sheller requests from the cluster during the harvest peak.", createdBy: usr("staff@") },
      { title: "Municipal Agriculture and Fishery Council (MAFC) Regular Session", startAt: at(-20, 9), endAt: at(-20, 12), venue: "Baco Municipal Session Hall", organizer: "MAFC Secretariat", agenda: "1. Review of agricultural programs\n2. Budget utilization\n3. Resolution on equipment sharing guidelines", description: "Regular session of the municipal council on agriculture and fishery.", audience: "All Farmers", status: "Completed", minutes: "Resolution No. 2026-014 adopting the municipal agricultural equipment sharing guidelines was approved, including the use of a digital request and scheduling system (AgriShare).", createdBy: usr("admin@") },
    ].map((meeting) => ({ minutes: "", ...meeting })));
  const meetingRows = await db.select({ id: meetings.id, title: meetings.title }).from(meetings);

  await db.insert(meetingAttendance).values([
    { meetingId: meetingRows[0].id, userId: usr("farmer@"), status: "Confirmed", respondedAt: at(-1, 12) },
    { meetingId: meetingRows[0].id, userId: usr("maria.santos"), status: "Invited" },
    { meetingId: meetingRows[0].id, userId: usr("association@"), status: "Confirmed", respondedAt: at(-1, 15) },
    { meetingId: meetingRows[0].id, userId: usr("anita.bituin"), status: "Invited" },
    { meetingId: meetingRows[1].id, userId: usr("farmer@"), status: "Invited" },
    { meetingId: meetingRows[1].id, userId: usr("barangay@"), status: "Confirmed", respondedAt: at(-2, 9) },
    { meetingId: meetingRows[2].id, userId: usr("operator@"), status: "Confirmed", respondedAt: at(-1, 8) },
    { meetingId: meetingRows[2].id, userId: usr("operator2@"), status: "Invited" },
    { meetingId: meetingRows[2].id, userId: usr("technician@"), status: "Confirmed", respondedAt: at(-1, 9) },
    { meetingId: meetingRows[3].id, userId: usr("lorna.aguilar"), status: "Attended", respondedAt: at(-9, 9) },
    { meetingId: meetingRows[4].id, userId: usr("association@"), status: "Attended", respondedAt: at(-20, 9) },
  ]);

  /* ----------------------------- programs ---------------------------- */
  await db
    .insert(programs)
    .values([
      { title: "Rice Competitiveness Enhancement Fund (RCEF) Seed Distribution", description: "Free certified inbred rice seeds for registered rice farmers of Baco.", eligibility: "Registered in RSBSA; actively farming rice; maximum of 3 hectares.", assistanceType: "Input Subsidy", opensAt: dstr(-10), deadline: dstr(20), slots: 350, status: "Open" },
      { title: "Farm Machinery Grant for Farmers' Associations", description: "Provision of hand tractors, threshers and shellers to accredited associations under a counterpart scheme.", eligibility: "CDA/DOLE-registered association with at least 25 active members and complete financial statements.", assistanceType: "Machinery Grant", opensAt: dstr(-5), deadline: dstr(35), slots: 4, status: "Open" },
      { title: "Corn Production Support Program", description: "Hybrid corn seeds and fertilizer support for the Dulangan and Catwiran corn clusters.", eligibility: "Corn farmers with at least 0.5 ha within the identified corn clusters.", assistanceType: "Input Subsidy", opensAt: dstr(-2), deadline: dstr(28), slots: 120, status: "Open" },
      { title: "Urban and Backyard Vegetable Gardening Kits", description: "Vegetable seed kits and gardening tools for households and school gardens.", eligibility: "Any Baco resident household or school with available planting area.", assistanceType: "Input Subsidy", opensAt: dstr(-45), deadline: dstr(-5), slots: 200, status: "Closed" },
      { title: "Farmers' Field School on Integrated Pest Management", description: "Season-long training on integrated pest management and good agricultural practices.", eligibility: "Rice or vegetable farmers endorsed by their association or barangay.", assistanceType: "Training", opensAt: dstr(3), deadline: dstr(40), slots: 40, status: "Upcoming" },
    ]);
  const programRows = await db.select({ id: programs.id, title: programs.title }).from(programs);

  await db.insert(applications).values([
    { programId: programRows[0].id, farmerId: frm("farmer@"), status: "Approved", notes: "6 bags allocated.", submittedAt: at(-8, 10) },
    { programId: programRows[0].id, farmerId: frm("maria.santos"), status: "Under Review", submittedAt: at(-3, 11) },
    { programId: programRows[0].id, farmerId: frm("ricardo.g"), status: "Submitted", submittedAt: at(-1, 9) },
    { programId: programRows[1].id, farmerId: frm("association@"), status: "Under Review", notes: "Association documents complete, pending ocular inspection.", submittedAt: at(-4, 14) },
    { programId: programRows[2].id, farmerId: frm("lorna.aguilar"), status: "Approved", notes: "4 ha allocation approved.", submittedAt: at(-2, 8) },
    { programId: programRows[3].id, farmerId: frm("pedro.villanueva"), status: "Completed", notes: "Kit released.", submittedAt: at(-30, 10) },
  ].map((application) => ({ notes: "", ...application })));

  /* --------------------------- notifications ------------------------- */
  await db.insert(notifications).values([
    { userId: usr("farmer@"), type: "request", title: "Request REQ-2601-0001 approved", message: "Your harvesting request for Dela Cruz Rice Field A has been approved and scheduled. Operator: Danilo C. Estrada.", link: "/dashboard/requests", createdAt: at(-1, 10) },
    { userId: usr("farmer@"), type: "schedule", title: "Upcoming harvester schedule", message: "Kubota DC-70 Combine Harvester is scheduled at your farm in 3 days, 7:00 AM.", link: "/dashboard/harvester", createdAt: at(0, 6) },
    { userId: usr("farmer@"), type: "announcement", title: "Urgent weather advisory posted", message: "Southwest monsoon enhanced by LPA — prepare standing crops.", link: "/announcements", createdAt: at(0, 6, 10) },
    { userId: usr("maria.santos"), type: "request", title: "Request REQ-2601-0002 under review", message: "A scheduling conflict was detected with REQ-2601-0001. MAO personnel are reviewing your request.", link: "/dashboard/requests", createdAt: at(-1, 14, 20) },
    { userId: usr("staff@"), type: "request", title: "2 new requests awaiting review", message: "REQ-2601-0005 and REQ-2601-0006 were submitted today.", link: "/dashboard/requests", createdAt: at(0, 9, 5) },
    { userId: usr("staff@"), type: "maintenance", title: "Maintenance due in 3 days", message: "MAO-HRV-003 corrective maintenance is scheduled to finish in 3 days.", link: "/dashboard/maintenance", createdAt: at(0, 7) },
    { userId: usr("admin@"), type: "conflict", title: "Scheduling conflict detected", message: "REQ-2601-0002 overlaps with an existing reservation for MAO-HRV-001.", link: "/dashboard/harvester", createdAt: at(-1, 14, 21) },
    { userId: usr("operator@"), type: "assignment", title: "New field assignment", message: "You are assigned to Dela Cruz Rice Field A, Barangay Alag in 3 days.", link: "/dashboard/assignments", createdAt: at(-1, 10, 5) },
  ]);

  /* ------------------------- agri information ------------------------ */
  await db.insert(marketPrices).values([
    { crop: "Palay (dry, clean)", category: "Cereal", market: "Baco Public Market", unit: "kg", price: "23.50", previousPrice: "22.80", priceDate: dstr(0) },
    { crop: "Palay (fresh/wet)", category: "Cereal", market: "Farm gate, Baco", unit: "kg", price: "18.00", previousPrice: "18.50", priceDate: dstr(0) },
    { crop: "Well-milled Rice", category: "Cereal", market: "Baco Public Market", unit: "kg", price: "48.00", previousPrice: "47.00", priceDate: dstr(0) },
    { crop: "Yellow Corn (dry)", category: "Cereal", market: "Calapan Trading Post", unit: "kg", price: "17.25", previousPrice: "16.90", priceDate: dstr(-1) },
    { crop: "Eggplant", category: "Vegetable", market: "Baco Public Market", unit: "kg", price: "55.00", previousPrice: "60.00", priceDate: dstr(0) },
    { crop: "Ampalaya", category: "Vegetable", market: "Baco Public Market", unit: "kg", price: "70.00", previousPrice: "65.00", priceDate: dstr(0) },
    { crop: "Tomato", category: "Vegetable", market: "Baco Public Market", unit: "kg", price: "60.00", previousPrice: "72.00", priceDate: dstr(-1) },
    { crop: "Calamansi", category: "Fruit", market: "Baco Public Market", unit: "kg", price: "45.00", previousPrice: "45.00", priceDate: dstr(-1) },
    { crop: "Banana (Lakatan)", category: "Fruit", market: "Calapan City Market", unit: "kg", price: "62.00", previousPrice: "58.00", priceDate: dstr(-2) },
    { crop: "Coconut (whole nut)", category: "Plantation", market: "Farm gate, Baco", unit: "piece", price: "12.00", previousPrice: "11.50", priceDate: dstr(-2) },
  ]);

  await db.insert(cropCalendar).values([
    { crop: "Rice (Wet Season)", season: "Wet Season", plantingStart: "May", plantingEnd: "July", harvestStart: "September", harvestEnd: "November", durationDays: 115, notes: "Main lowland cropping supported by rainfall and NIA irrigation.", advisory: "Coordinate harvester bookings by August to avoid peak-season conflicts." },
    { crop: "Rice (Dry Season)", season: "Dry Season", plantingStart: "November", plantingEnd: "January", harvestStart: "March", harvestEnd: "May", durationDays: 110, notes: "Requires irrigation support; highest harvester demand in April.", advisory: "Request supplemental irrigation pumps early during El Niño advisories." },
    { crop: "Yellow Corn", season: "Wet Season", plantingStart: "June", plantingEnd: "July", harvestStart: "September", harvestEnd: "October", durationDays: 105, notes: "Dulangan and Catwiran clusters.", advisory: "Book corn sheller two weeks before target harvest date." },
    { crop: "Eggplant", season: "Year-round", plantingStart: "October", plantingEnd: "December", harvestStart: "January", harvestEnd: "April", durationDays: 90, notes: "Upland vegetable areas of Mangangan.", advisory: "Monitor fruit and shoot borer; request IPM assistance." },
    { crop: "Ampalaya", season: "Dry Season", plantingStart: "November", plantingEnd: "January", harvestStart: "January", harvestEnd: "April", durationDays: 75, notes: "Trellised production.", advisory: "Ensure water pump availability during flowering." },
    { crop: "Tomato", season: "Dry Season", plantingStart: "October", plantingEnd: "November", harvestStart: "January", harvestEnd: "March", durationDays: 95, notes: "Cool months favor fruit set.", advisory: "Avoid planting during heavy monsoon." },
    { crop: "Banana (Lakatan)", season: "Year-round", plantingStart: "June", plantingEnd: "August", harvestStart: "May", harvestEnd: "December", durationDays: 300, notes: "Perennial, staggered harvest.", advisory: "Request hauling truck assistance for bulk deliveries." },
    { crop: "Coconut", season: "Year-round", plantingStart: "June", plantingEnd: "September", harvestStart: "January", harvestEnd: "December", durationDays: 365, notes: "Harvested every 45–60 days.", advisory: "Coordinate with PCA for replanting programs." },
  ]);

  await db.insert(auditLogs).values([
    { userId: usr("staff@"), userName: "Ma. Cristina L. Fajardo", action: "APPROVE", module: "Equipment Requests", recordId: "REQ-2601-0001", details: "Approved harvesting request and created reservation for MAO-HRV-001.", createdAt: at(-1, 10) },
    { userId: usr("admin@"), userName: "Engr. Ramon T. Bautista", action: "REJECT", module: "Equipment Requests", recordId: "REQ-2601-0008", details: "Rejected request: unit under corrective maintenance.", createdAt: at(-2, 9) },
    { userId: usr("technician@"), userName: "Eduardo N. Lopez", action: "CREATE", module: "Maintenance", recordId: "MAO-HRV-003", details: "Logged corrective maintenance for threshing drum bearing.", createdAt: at(-4, 11) },
    { userId: usr("admin@"), userName: "Engr. Ramon T. Bautista", action: "UPDATE", module: "Equipment", recordId: "MAO-HRV-003", details: "Status changed from Available to Under Maintenance.", createdAt: at(-4, 11, 5) },
    { userId: usr("coordinator@"), userName: "Arnel D. Manalo", action: "PUBLISH", module: "Announcements", recordId: "ANN-0003", details: "Published RCEF certified seed availability announcement.", createdAt: at(-3, 9) },
    { userId: usr("admin@"), userName: "Engr. Ramon T. Bautista", action: "PUBLISH", module: "Announcements", recordId: "ANN-0002", details: "Published urgent weather advisory.", createdAt: at(0, 6) },
    { userId: usr("staff@"), userName: "Ma. Cristina L. Fajardo", action: "CREATE", module: "Meetings", recordId: "MTG-0002", details: "Created Barangay Alag Irrigators Association Assembly.", createdAt: at(-2, 10) },
    { userId: usr("staff@"), userName: "Ma. Cristina L. Fajardo", action: "ASSIGN", module: "Scheduling", recordId: "RES-0001", details: "Assigned operator Danilo C. Estrada to reservation RES-0001.", createdAt: at(-1, 10, 2) },
    { userId: usr("admin@"), userName: "Engr. Ramon T. Bautista", action: "CREATE", module: "User Management", recordId: "USR-0015", details: "Created auditor account for COA representative.", createdAt: at(-30, 14) },
    { userId: usr("coordinator@"), userName: "Arnel D. Manalo", action: "UPDATE", module: "Market Prices", recordId: "MKT-DAILY", details: "Updated daily market price monitoring sheet.", createdAt: at(0, 8) },
  ]);

  await db.insert(settings).values([
    { key: "office_name", value: "Municipal Agriculture Office of Baco", label: "Office Name", group: "General" },
    { key: "office_address", value: "Baco Municipal Hall, Poblacion, Baco, Oriental Mindoro 5201", label: "Office Address", group: "General" },
    { key: "office_email", value: "mao.baco@oriental-mindoro.gov.ph", label: "Official Email", group: "General" },
    { key: "office_hotline", value: "(043) 288-0123 / 0917-555-0100", label: "Hotline", group: "General" },
    { key: "office_hours", value: "Monday to Friday, 8:00 AM – 5:00 PM", label: "Office Hours", group: "General" },
    { key: "request_lead_days", value: "3", label: "Minimum Request Lead Time (days)", group: "Scheduling" },
    { key: "max_booking_hours", value: "10", label: "Maximum Booking Duration (hours)", group: "Scheduling" },
    { key: "conflict_detection", value: "enabled", label: "Automatic Conflict Detection", group: "Scheduling" },
    { key: "weather_location", value: "Baco, Oriental Mindoro (13.36°N, 121.10°E)", label: "Weather Monitoring Point", group: "Integrations" },
    { key: "weather_provider", value: "Open-Meteo Public API (live, server-cached)", label: "Weather Data Source", group: "Integrations" },
    { key: "map_provider", value: "Leaflet + OpenStreetMap", label: "Map Provider", group: "Integrations" },
  ]);

  await db.insert(plantDiagnoses).values([
    {
      userId: usr("farmer@"),
      farmerName: "Juan P. Dela Cruz",
      barangayId: brgy("Alag"),
      cropType: "Rice",
      diseaseName: "Rice Blast",
      scientificName: "Pyricularia oryzae",
      confidence: "96.40",
      severity: "Severe",
      imageUrl: "https://images.pexels.com/photos/35187052/pexels-photo-35187052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      symptoms: [
        "Diamond/spindle-shaped lesions with grayish-white centers and dark brown borders",
        "Lesions coalescing on upper leaves",
        "Neck node browning and rot"
      ],
      causes: "High humidity and continuous cloudy rain following typhoon advisory in Oriental Mindoro.",
      treatments: {
        organic: ["Foliar spray of Trichoderma harzianum bio-fungicide", "Neem seed kernel extract 5%"],
        chemical: ["Azoxystrobin + Difenoconazole at 15ml / 16L knapsack", "Tricyclazole 75% WP"],
        cultural: ["Split nitrogen fertilizer application", "Drain stagnant water for 2 days"]
      },
      prevention: "Plant resistant variety NSIC Rc222.",
      status: "Verified by MAO",
      technologistNotes: "Validated by MAO Technologist Cristina Fajardo during field inspection.",
      createdAt: at(-1, 8),
    },
    {
      userId: usr("lorna.aguilar"),
      farmerName: "Lorna B. Aguilar",
      barangayId: brgy("Dulangan I"),
      cropType: "Corn",
      diseaseName: "Fall Armyworm Infestation",
      scientificName: "Spodoptera frugiperda",
      confidence: "97.80",
      severity: "Severe",
      imageUrl: "https://images.pexels.com/photos/10893497/pexels-photo-10893497.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      symptoms: [
        "Ragged windowpane feeding holes on young corn whorls",
        "Heavy sawdust-like frass inside leaf funnel",
        "Larva with inverted Y mark on head"
      ],
      causes: "Staggered corn planting in adjacent barangays.",
      treatments: {
        organic: ["Bacillus thuringiensis (Bt) spray late afternoon", "Metarhizium anisopliae application"],
        chemical: ["Emamectin benzoate 5% WDG directed into whorl", "Chlorantraniliprole 18.5% SC"],
        cultural: ["Install pheromone traps", "Synchronize corn planting window"]
      },
      prevention: "Scout corn plots every 3 days. Coordinate with Dulangan Corn Cluster.",
      status: "Verified by MAO",
      technologistNotes: "MAO provided 2 knapsack sprayers and bio-control inputs.",
      createdAt: at(-3, 11),
    },
    {
      userId: usr("pedro.villanueva"),
      farmerName: "Pedro L. Villanueva",
      barangayId: brgy("Mangangan I"),
      cropType: "Eggplant",
      diseaseName: "Eggplant Fruit & Shoot Borer",
      scientificName: "Leucinodes orbonalis",
      confidence: "94.50",
      severity: "Moderate",
      imageUrl: "https://images.pexels.com/photos/34632627/pexels-photo-34632627.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      symptoms: [
        "Wilting of apical growing shoots",
        "Bore-holes on developing eggplant fruits"
      ],
      causes: "High vegetable cropping density in Mangangan upland.",
      treatments: {
        organic: ["Manual clipping and destruction of infested shoots", "Neem oil spray"],
        chemical: ["Flubendiamide 480 SC at fruit set stage"],
        cultural: ["Install sex pheromone traps", "Rotate with non-solanaceous crops"]
      },
      prevention: "Regular scouting and crop rotation.",
      status: "Resolved",
      technologistNotes: "Resolved after pheromone trap installation.",
      createdAt: at(-5, 9),
    }
  ]);

  await db.execute(sql`select 1`);
}
