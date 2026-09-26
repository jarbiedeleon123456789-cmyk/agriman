# 🐬 AgriShare — Gabay sa Paggamit ng MySQL at phpMyAdmin (XAMPP / WAMP / Laragon)

Naka-ready na ang buong database ng **AgriShare** para sa **phpMyAdmin at MySQL**! Kasama na ang complete SQL dump (`agrishare_mysql_phpmyadmin.sql`) na may 26 tables, foreign keys, indexes, at kumpletong sample data para sa Municipal Agriculture Office ng Baco, Oriental Mindoro.

---

## 🚀 Mabilis na Hakbang (Step-by-Step para sa XAMPP / phpMyAdmin)

### 1. Buksan ang XAMPP
1. Buksan ang **XAMPP Control Panel**.
2. I-click ang **Start** sa **Apache** at **MySQL**.

### 2. Mag-import sa phpMyAdmin
1. Buksan ang iyong browser at pumunta sa:  
   👉 **`http://localhost/phpmyadmin`**
2. Sa kaliwang menu, i-click ang **"New"** (o "Bago").
3. Pangalanan ang database na: **`agrishare_db`** (Collation: `utf8mb4_unicode_ci` o `utf8mb4_general_ci`).
4. I-click ang **"Create"**.
5. I-click ang database na **`agrishare_db`** sa kaliwa.
6. Sa itaas na tabs, i-click ang **"Import"** (o "I-import").
7. I-click ang **"Choose File"** (Pumili ng File) at piliin ang:
   📁 **`mysql/agrishare_mysql_phpmyadmin.sql`** (o `public/agrishare_mysql_phpmyadmin.sql`)
8. Mag-scroll pababa at i-click ang **"Import"** / **"Go"** button.
9. 🎉 Lalabas ang green checkmark: *Import has been successfully finished!* (26 tables created).

---

## 💻 3. I-configure ang `.env` sa VS Code

Buksan ang proyekto sa **VS Code**, at i-edit ang iyong `.env` file:

```env
# MySQL / phpMyAdmin Connection (XAMPP Default)
DATABASE_URL=mysql://root:@127.0.0.1:3306/agrishare_db

# O kung may password ang iyong root user sa MySQL:
# DATABASE_URL=mysql://root:password123@127.0.0.1:3306/agrishare_db

SESSION_SECRET=agrishare-baco-oriental-mindoro-secret-key-2026
TZ=Asia/Manila
```

---

## 📦 4. I-run ang Project sa VS Code

Sa terminal ng VS Code:

```bash
# 1. I-install ang dependencies (kung bago i-extract ang zip)
npm install

# 2. I-run ang Next.js development server
npm run dev
```

Buksan sa browser ang:  
👉 **`http://localhost:3000`**

---

## 🔑 Demo Accounts (Lahat ay may password na: `agrishare123`)

| Role | Email | Deskripsyon |
|---|---|---|
| **MAO Administrator** | `admin@agrishare.gov.ph` | Buong administrative control, approvals, inventory, reports, settings |
| **MAO Staff / Coordinator** | `staff@agrishare.gov.ph` | Operational requests review, scheduling, advisories |
| **Farmer** | `farmer@agrishare.gov.ph` | Juan Dela Cruz (Alag) — mag-request ng harvester / tractor |
| **Farmer (Maria Santos)** | `maria.santos@agrishare.gov.ph` | Maria Santos (Bayanan) |
| **Association Officer** | `association@agrishare.gov.ph` | Baco Rice Farmers Association (BRFA) |
| **Barangay Representative** | `barangay@agrishare.gov.ph` | Kgd. Vilma Pastrana (Barangay Alag) |
| **Driver / Operator** | `operator@agrishare.gov.ph` | Danilo Estrada (Combine Harvester Operator) |
| **System Auditor** | `auditor@agrishare.gov.ph` | COA Representative (Read-only monitoring) |

---

## 📋 Talaan ng 26 Tables sa phpMyAdmin

1. `roles` — Access control roles & JSON permissions
2. `barangays` — 17 barangays ng Baco na may GIS coordinates at farmland area
3. `associations` — Accredited farmers' associations (BRFA, AIA, MVG, etc.)
4. `users` — Authentication accounts, passwords (scrypt hash), roles
5. `farmers` — RSBSA number, address, contact, farm size, main crop
6. `farms` — Mapped farm plots na may latitude & longitude coordinates
7. `operators` — Drivers, combine operators, at machinery technicians
8. `equipment_categories` — Harvesters, tractors, threshers, transport, post-harvest, irrigation
9. `equipment` — Municipal machinery inventory na may asset code, status, rates, image
10. `resources` — Certified seeds, organic fertilizer, solar dryer slots, sprayers
11. `maintenance_records` — Preventive at corrective maintenance history at costs
12. `equipment_requests` — Farmer requests na may service type, dates, crop, area, review notes
13. `reservations` — Confirmed harvester & equipment bookings na may double-booking prevention
14. `waitlist` — Queued requests kapag fully booked ang preferred date
15. `announcements` — MAO advisories, weather warnings, categories, priority, target audience
16. `announcement_reads` — Read/unread tracking ng bawat farmer
17. `meetings` — Coordination assemblies, agenda, venue, schedule, uploaded minutes
18. `meeting_attendance` — RSVPs at attendance tracking (Invited, Confirmed, Attended)
19. `notifications` — In-app notification center para sa approvals, schedules, advisories
20. `programs` — RCEF seed subsidy, machinery grants, FFS trainings
21. `applications` — Farmer program applications at evaluation status
22. `market_prices` — Daily farm-gate at market price monitoring
23. `crop_calendar` — Planting at harvest windows para sa lowland & upland crops
24. `weather_cache` — Cached agricultural weather data (Open-Meteo API)
25. `audit_logs` — Immutable administrative event history
26. `settings` — MAO office details, hotline, lead days, conflict detection rules

---

## 💡 Alternatibong Pag-export / Download
Maaari ring i-download ang `.sql` file nang direkta mula sa browser:
- I-click ang **"⬇️ phpMyAdmin MySQL DB (.sql)"** sa footer ng website o pumunta sa `http://localhost:3000/api/mysql-dump`.
