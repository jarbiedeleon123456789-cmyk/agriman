# 🌾 AgriShare

**A Web-Based Agricultural Resource-Sharing and Scheduling Platform for the Municipal Agriculture Office (MAO) of Baco, Oriental Mindoro.**

AgriShare is a working full-stack prototype (not just a static mock-up): every module listed in the specification is
backed by database tables, server-side validation, conflict checking, role-based access control and an audit trail.

---

## 🐬 Paggamit sa phpMyAdmin & MySQL (XAMPP / WAMP / Laragon)

Naka-ready na ang **MySQL / phpMyAdmin** database file para sa **1-click import**:

1. Buksan ang **XAMPP** at i-start ang **Apache** at **MySQL**.
2. Pumunta sa **`http://localhost/phpmyadmin`**.
3. Gumawa ng bagong database: **`agrishare_db`**.
4. I-click ang **Import** tab, piliin ang file:  
   📁 **`mysql/agrishare_mysql_phpmyadmin.sql`** (o i-download sa site: `/api/mysql-dump`), at i-click ang **Import / Go**.
5. Sa iyong `.env` sa VS Code, ilagay:
   ```env
   DATABASE_URL=mysql://root:@127.0.0.1:3306/agrishare_db
   TZ=Asia/Manila
   ```
6. I-run sa terminal ng VS Code:
   ```bash
   npm install
   npm run dev
   ```
7. Buksan ang **`http://localhost:3000`**!

*(Para sa detalyadong gabay sa Tagalog, tingnan ang [`MYSQL_PHPMYADMIN_GUIDE.md`](./MYSQL_PHPMYADMIN_GUIDE.md).)*

---

## ⚡ Quick start (PostgreSQL / Next.js)

```bash
# 1. install dependencies
npm install

# 2. create the database tables
npx drizzle-kit push --config=drizzle.config.json --force

# 3. run the app
npm run dev          # http://localhost:3000
```

Sample data (barangays, farmers, equipment, requests, schedules, announcements, meetings, programs, market prices,
audit logs …) is **seeded automatically** the first time any page or `/api/health` is opened on an empty database.

### `.env`

```env
# PostgreSQL (Default)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# O kaya MySQL / phpMyAdmin:
# DATABASE_URL=mysql://root:@127.0.0.1:3306/agrishare_db

SESSION_SECRET=change-me-in-production
TZ=Asia/Manila
```

### Production build

```bash
npm run build
npm run start
```

---

## 🔑 Demo accounts (Password: `agrishare123`)

| Role | Email | Deskripsyon |
| --- | --- | --- |
| **MAO Administrator** | `admin@agrishare.gov.ph` | Full administrative control, approvals, inventory, reports, settings |
| **MAO Staff / Coordinator** | `staff@agrishare.gov.ph` | Operational requests review, scheduling, advisories |
| **Farmer** | `farmer@agrishare.gov.ph` | Juan Dela Cruz (Alag) — harvester / tractor booking |
| **Association Officer** | `association@agrishare.gov.ph` | Baco Rice Farmers Association (BRFA) |
| **Barangay Representative** | `barangay@agrishare.gov.ph` | Kgd. Vilma Pastrana (Barangay Alag) |
| **Driver / Operator** | `operator@agrishare.gov.ph` | Danilo Estrada (Combine Harvester Operator) |
| **System Auditor** | `auditor@agrishare.gov.ph` | COA Representative (Read-only monitoring) |

---

## 📦 Implemented modules

**Public site** — **AI Crop Doctor & Disease Scanner (photo detection, confidence score, organic & DA chemical prescriptions)** · landing page with quick actions and statistics · announcements & advisories (search, category,
priority, archive, read tracking) · equipment & resource catalog with availability · equipment detail with availability
calendar, maintenance history and QR concept · municipality-wide harvester schedule with conflict highlighting · farm &
service map (Leaflet + OpenStreetMap) · weather (live Open-Meteo API + server cache + source/timestamp) · market prices ·
crop calendar · assistance programs · meetings & minutes · about · contact/FAQ · login · farmer registration · **phpMyAdmin SQL download**.

**Farmer** — **AI Crop Doctor scanner & diagnostic history** · dashboard, profile, farms (CRUD + map), request equipment/resource with live availability &
conflict checking, waiting list, request tracking and cancellation, request lifecycle timeline, harvester schedule,
announcements, meetings with RSVP, programs & applications, notifications, map.

**MAO (admin/staff)** — KPI dashboard with charts and conflict alerts, request approval queue (approve / reject /
request revision, operator assignment, schedule confirmation), harvester & equipment scheduling (assign, reschedule,
status), equipment inventory CRUD + status, resource inventory, maintenance logging, farmer directory & profiles,
associations, barangays, announcement management (draft/schedule/publish/archive/delete), meeting management with
attendance sheet and minutes, programs & application evaluation, market price encoding, reports & analytics with CSV
export, notifications, user & role management, audit logs, system settings.

**Operator / driver** — assignment list with destination, contact, directions and job status updates, maintenance
logging.

**Auditor** — read-only reports and audit logs.

---

## 🛠️ Tech stack & Database Support

| Layer | Technology |
| --- | --- |
| Database Engines | **MySQL / phpMyAdmin** (`mysql/agrishare_mysql_phpmyadmin.sql`) & **PostgreSQL** |
| Database Schemas | `src/db/mysql-schema.ts` (MySQL) & `src/db/schema.ts` (PostgreSQL) |
| Framework | Next.js 16 (App Router, React Server Components, Server Actions) |
| Styling | Tailwind CSS v4 + Fraunces & Inter fonts |
| Motion | Framer Motion + Lenis smooth scroll |
| Mapping | Leaflet + React-Leaflet + OpenStreetMap tiles |
| Weather | Open-Meteo public REST API with database caching (`weather_cache`) |
| Auth | scrypt password hashing + signed HTTP-only session cookie + RBAC |

---

## 🚫 Scope boundary

As agreed in the project direction, **AI pest/disease detection is NOT part of the AgriShare core scope** — existing
solutions already address it. Blockchain and advanced computer vision are likewise excluded. Innovation is focused on
agricultural resource sharing, scheduling, coordination, mapping, communication and administrative decision support.
