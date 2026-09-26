import { Pool } from "pg";
import fs from "node:fs";

async function generate() {
  const pool = new Pool({ connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
  const client = await pool.connect();

  const tables = [
    "roles", "barangays", "associations", "users", "operators", "farmers",
    "farms", "equipment_categories", "equipment", "resources", "maintenance_records",
    "equipment_requests", "reservations", "waitlist", "announcements",
    "announcement_reads", "meetings", "meeting_attendance", "notifications",
    "programs", "applications", "market_prices", "crop_calendar",
    "weather_cache", "audit_logs", "settings", "plant_diagnoses"
  ];

  let sql = `-- ==============================================================================
-- AgriShare: A Web-Based Agricultural Resource-Sharing and Scheduling Platform
-- Municipal Agriculture Office (MAO) of Baco, Oriental Mindoro
--
-- phpMyAdmin / MySQL Database Dump
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, XAMPP, WAMP, Laragon
-- ==============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+08:00";
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS \`agrishare_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`agrishare_db\`;

`;

  const ddl: Record<string, string> = {
    roles: `CREATE TABLE IF NOT EXISTS \`roles\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL UNIQUE,
  \`role_name\` varchar(100) NOT NULL,
  \`description\` text NOT NULL,
  \`permissions\` json NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    barangays: `CREATE TABLE IF NOT EXISTS \`barangays\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`municipality\` varchar(100) NOT NULL DEFAULT 'Baco',
  \`province\` varchar(100) NOT NULL DEFAULT 'Oriental Mindoro',
  \`lat\` decimal(10,6) NOT NULL,
  \`lng\` decimal(10,6) NOT NULL,
  \`farmland_ha\` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    associations: `CREATE TABLE IF NOT EXISTS \`associations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`acronym\` varchar(50) NOT NULL DEFAULT '',
  \`contact_person\` varchar(255) NOT NULL DEFAULT '',
  \`contact_number\` varchar(50) NOT NULL DEFAULT '',
  \`barangay_id\` int(11) DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (\`id\`),
  KEY \`barangay_id\` (\`barangay_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    users: `CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL UNIQUE,
  \`phone\` varchar(50) NOT NULL DEFAULT '',
  \`password_hash\` varchar(255) NOT NULL,
  \`role\` varchar(50) NOT NULL DEFAULT 'farmer',
  \`barangay_id\` int(11) DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Active',
  \`avatar_emoji\` varchar(10) NOT NULL DEFAULT '🧑‍🌾',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`role\` (\`role\`),
  KEY \`barangay_id\` (\`barangay_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    operators: `CREATE TABLE IF NOT EXISTS \`operators\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`specialization\` varchar(255) NOT NULL DEFAULT 'Harvester Operator',
  \`license_no\` varchar(100) NOT NULL DEFAULT '',
  \`availability\` varchar(50) NOT NULL DEFAULT 'Available',
  \`status\` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    farmers: `CREATE TABLE IF NOT EXISTS \`farmers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`association_id\` int(11) DEFAULT NULL,
  \`barangay_id\` int(11) DEFAULT NULL,
  \`rsbsa_number\` varchar(100) NOT NULL DEFAULT '',
  \`address\` text NOT NULL,
  \`birth_date\` date DEFAULT NULL,
  \`gender\` varchar(20) NOT NULL DEFAULT '',
  \`preferred_contact\` varchar(50) NOT NULL DEFAULT 'Mobile',
  \`total_area_ha\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`main_crop\` varchar(100) NOT NULL DEFAULT 'Rice',
  \`status\` varchar(50) NOT NULL DEFAULT 'Active',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  KEY \`barangay_id\` (\`barangay_id\`),
  KEY \`association_id\` (\`association_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    farms: `CREATE TABLE IF NOT EXISTS \`farms\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`farmer_id\` int(11) NOT NULL,
  \`barangay_id\` int(11) DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`crop\` varchar(100) NOT NULL DEFAULT 'Rice',
  \`area_ha\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`lat\` decimal(10,6) NOT NULL,
  \`lng\` decimal(10,6) NOT NULL,
  \`landmark\` text NOT NULL,
  \`notes\` text NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`farmer_id\` (\`farmer_id\`),
  KEY \`barangay_id\` (\`barangay_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    equipment_categories: `CREATE TABLE IF NOT EXISTS \`equipment_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`category_name\` varchar(100) NOT NULL,
  \`description\` text NOT NULL,
  \`icon\` varchar(10) NOT NULL DEFAULT '🚜',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    equipment: `CREATE TABLE IF NOT EXISTS \`equipment\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`category_id\` int(11) DEFAULT NULL,
  \`asset_code\` varchar(50) NOT NULL UNIQUE,
  \`description\` text NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Available',
  \`condition\` varchar(50) NOT NULL DEFAULT 'Good',
  \`owner_office\` varchar(255) NOT NULL DEFAULT 'MAO Baco',
  \`home_barangay_id\` int(11) DEFAULT NULL,
  \`location\` varchar(255) NOT NULL DEFAULT 'MAO Motorpool, Baco',
  \`lat\` decimal(10,6) DEFAULT NULL,
  \`lng\` decimal(10,6) DEFAULT NULL,
  \`image_url\` text NOT NULL,
  \`default_operator_id\` int(11) DEFAULT NULL,
  \`rate_per_ha\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`capacity_note\` varchar(255) NOT NULL DEFAULT '',
  \`next_maintenance_due\` date DEFAULT NULL,
  \`notes\` text NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`category_id\` (\`category_id\`),
  KEY \`home_barangay_id\` (\`home_barangay_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    resources: `CREATE TABLE IF NOT EXISTS \`resources\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`type\` varchar(100) NOT NULL DEFAULT 'Service',
  \`description\` text NOT NULL,
  \`unit\` varchar(50) NOT NULL DEFAULT 'unit',
  \`quantity_total\` int(11) NOT NULL DEFAULT 0,
  \`quantity_available\` int(11) NOT NULL DEFAULT 0,
  \`availability\` varchar(50) NOT NULL DEFAULT 'Available',
  \`notes\` text NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    maintenance_records: `CREATE TABLE IF NOT EXISTS \`maintenance_records\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`equipment_id\` int(11) NOT NULL,
  \`service_date\` date NOT NULL,
  \`type\` varchar(100) NOT NULL DEFAULT 'Preventive',
  \`description\` text NOT NULL,
  \`cost\` decimal(12,2) NOT NULL DEFAULT 0.00,
  \`next_due\` date DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Completed',
  \`recorded_by\` int(11) DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`equipment_id\` (\`equipment_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    equipment_requests: `CREATE TABLE IF NOT EXISTS \`equipment_requests\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL UNIQUE,
  \`farmer_id\` int(11) NOT NULL,
  \`equipment_id\` int(11) DEFAULT NULL,
  \`resource_id\` int(11) DEFAULT NULL,
  \`farm_id\` int(11) DEFAULT NULL,
  \`barangay_id\` int(11) DEFAULT NULL,
  \`service_type\` varchar(100) NOT NULL DEFAULT 'Harvesting',
  \`requested_start\` datetime NOT NULL,
  \`requested_end\` datetime NOT NULL,
  \`purpose\` text NOT NULL,
  \`crop_type\` varchar(100) NOT NULL DEFAULT 'Rice',
  \`area_ha\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`priority\` varchar(50) NOT NULL DEFAULT 'Normal',
  \`attachment_name\` varchar(255) NOT NULL DEFAULT '',
  \`notes\` text NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Submitted',
  \`review_notes\` text NOT NULL,
  \`reviewed_by\` int(11) DEFAULT NULL,
  \`reviewed_at\` datetime DEFAULT NULL,
  \`completed_at\` datetime DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`farmer_id\` (\`farmer_id\`),
  KEY \`equipment_id\` (\`equipment_id\`),
  KEY \`status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    reservations: `CREATE TABLE IF NOT EXISTS \`reservations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`request_id\` int(11) DEFAULT NULL,
  \`equipment_id\` int(11) NOT NULL,
  \`farmer_id\` int(11) DEFAULT NULL,
  \`farm_id\` int(11) DEFAULT NULL,
  \`barangay_id\` int(11) DEFAULT NULL,
  \`service_type\` varchar(100) NOT NULL DEFAULT 'Harvesting',
  \`start_at\` datetime NOT NULL,
  \`end_at\` datetime NOT NULL,
  \`operator_id\` int(11) DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Scheduled',
  \`is_harvester\` tinyint(1) NOT NULL DEFAULT 0,
  \`remarks\` text NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`equipment_id\` (\`equipment_id\`),
  KEY \`start_at\` (\`start_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    waitlist: `CREATE TABLE IF NOT EXISTS \`waitlist\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`request_id\` int(11) DEFAULT NULL,
  \`equipment_id\` int(11) DEFAULT NULL,
  \`farmer_id\` int(11) DEFAULT NULL,
  \`preferred_date\` date DEFAULT NULL,
  \`note\` text NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Waiting',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    announcements: `CREATE TABLE IF NOT EXISTS \`announcements\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`body\` text NOT NULL,
  \`category\` varchar(100) NOT NULL DEFAULT 'General Announcement',
  \`priority\` varchar(50) NOT NULL DEFAULT 'Normal',
  \`audience\` varchar(100) NOT NULL DEFAULT 'All Farmers',
  \`barangay_id\` int(11) DEFAULT NULL,
  \`association_id\` int(11) DEFAULT NULL,
  \`attachment_name\` varchar(255) NOT NULL DEFAULT '',
  \`publish_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`expires_at\` datetime DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Published',
  \`views\` int(11) NOT NULL DEFAULT 0,
  \`created_by\` int(11) DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    announcement_reads: `CREATE TABLE IF NOT EXISTS \`announcement_reads\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`announcement_id\` int(11) NOT NULL,
  \`user_id\` int(11) NOT NULL,
  \`read_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`announcement_id\` (\`announcement_id\`),
  KEY \`user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    meetings: `CREATE TABLE IF NOT EXISTS \`meetings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`start_at\` datetime NOT NULL,
  \`end_at\` datetime NOT NULL,
  \`venue\` varchar(255) NOT NULL,
  \`organizer\` varchar(255) NOT NULL DEFAULT 'Municipal Agriculture Office',
  \`agenda\` text NOT NULL,
  \`description\` text NOT NULL,
  \`audience\` varchar(100) NOT NULL DEFAULT 'All Farmers',
  \`barangay_id\` int(11) DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Upcoming',
  \`minutes\` text NOT NULL,
  \`attachment_name\` varchar(255) NOT NULL DEFAULT '',
  \`created_by\` int(11) DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    meeting_attendance: `CREATE TABLE IF NOT EXISTS \`meeting_attendance\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`meeting_id\` int(11) NOT NULL,
  \`user_id\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Invited',
  \`responded_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`meeting_id\` (\`meeting_id\`),
  KEY \`user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    notifications: `CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`type\` varchar(50) NOT NULL DEFAULT 'system',
  \`title\` varchar(255) NOT NULL,
  \`message\` text NOT NULL,
  \`link\` varchar(255) NOT NULL DEFAULT '',
  \`read_at\` datetime DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    programs: `CREATE TABLE IF NOT EXISTS \`programs\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`description\` text NOT NULL,
  \`eligibility\` text NOT NULL,
  \`assistance_type\` varchar(100) NOT NULL DEFAULT 'Input Subsidy',
  \`opens_at\` date DEFAULT NULL,
  \`deadline\` date DEFAULT NULL,
  \`slots\` int(11) NOT NULL DEFAULT 0,
  \`status\` varchar(50) NOT NULL DEFAULT 'Open',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    applications: `CREATE TABLE IF NOT EXISTS \`applications\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`program_id\` int(11) NOT NULL,
  \`farmer_id\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Submitted',
  \`notes\` text NOT NULL,
  \`submitted_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`program_id\` (\`program_id\`),
  KEY \`farmer_id\` (\`farmer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    market_prices: `CREATE TABLE IF NOT EXISTS \`market_prices\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`crop\` varchar(100) NOT NULL,
  \`category\` varchar(100) NOT NULL DEFAULT 'Cereal',
  \`market\` varchar(255) NOT NULL DEFAULT 'Baco Public Market',
  \`unit\` varchar(50) NOT NULL DEFAULT 'kg',
  \`price\` decimal(10,2) NOT NULL,
  \`previous_price\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`price_date\` date NOT NULL,
  \`source\` varchar(255) NOT NULL DEFAULT 'MAO Baco Market Monitoring',
  \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    crop_calendar: `CREATE TABLE IF NOT EXISTS \`crop_calendar\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`crop\` varchar(100) NOT NULL,
  \`season\` varchar(100) NOT NULL DEFAULT 'Wet Season',
  \`planting_start\` varchar(50) NOT NULL,
  \`planting_end\` varchar(50) NOT NULL,
  \`harvest_start\` varchar(50) NOT NULL,
  \`harvest_end\` varchar(50) NOT NULL,
  \`duration_days\` int(11) NOT NULL DEFAULT 110,
  \`notes\` text NOT NULL,
  \`advisory\` text NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    weather_cache: `CREATE TABLE IF NOT EXISTS \`weather_cache\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`location\` varchar(255) NOT NULL,
  \`payload\` json NOT NULL,
  \`source\` varchar(255) NOT NULL,
  \`fetched_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    audit_logs: `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`user_name\` varchar(255) NOT NULL DEFAULT 'System',
  \`action\` varchar(100) NOT NULL,
  \`module\` varchar(100) NOT NULL,
  \`record_id\` varchar(100) NOT NULL DEFAULT '',
  \`details\` text NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    settings: `CREATE TABLE IF NOT EXISTS \`settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`key\` varchar(100) NOT NULL UNIQUE,
  \`value\` text NOT NULL,
  \`label\` varchar(255) NOT NULL,
  \`group\` varchar(100) NOT NULL DEFAULT 'General',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    plant_diagnoses: `CREATE TABLE IF NOT EXISTS \`plant_diagnoses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`farmer_name\` varchar(255) NOT NULL DEFAULT 'Guest Farmer',
  \`barangay_id\` int(11) DEFAULT NULL,
  \`crop_type\` varchar(100) NOT NULL,
  \`disease_name\` varchar(255) NOT NULL,
  \`scientific_name\` varchar(255) NOT NULL DEFAULT '',
  \`confidence\` decimal(5,2) NOT NULL DEFAULT 95.00,
  \`severity\` varchar(50) NOT NULL DEFAULT 'Moderate',
  \`image_url\` text NOT NULL,
  \`symptoms\` json NOT NULL,
  \`causes\` text NOT NULL,
  \`treatments\` json NOT NULL,
  \`prevention\` text NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'Pending Review',
  \`technologist_notes\` text NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  KEY \`barangay_id\` (\`barangay_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  for (const t of tables) {
    sql += `-- -----------------------------------------------------------------------------\n`;
    sql += `-- Table structure for \`${t}\`\n`;
    sql += `-- -----------------------------------------------------------------------------\n`;
    sql += (ddl[t] || `-- ${t}`) + `\n\n`;

    const res = await client.query(`SELECT * FROM "${t}" ORDER BY id ASC`);
    if (res.rows.length > 0) {
      sql += `-- Dumping data for table \`${t}\` (${res.rows.length} rows)\n`;
      const cols = Object.keys(res.rows[0]);
      const colList = cols.map(c => `\`${c}\``).join(", ");

      const valRows = res.rows.map(row => {
        const vals = cols.map(c => {
          const v = (row as Record<string, unknown>)[c];
          if (v === null || v === undefined) return "NULL";
          if (typeof v === "boolean") return v ? "1" : "0";
          if (typeof v === "number") return String(v);
          if (typeof v === "object" && !(v instanceof Date)) {
            return "'" + JSON.stringify(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
          }
          if (v instanceof Date) {
            const dstr = `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())} ${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`;
            return `'${dstr}'`;
          }
          return "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "'";
        });
        return `  (${vals.join(", ")})`;
      });

      sql += `INSERT INTO \`${t}\` (${colList}) VALUES\n` + valRows.join(",\n") + `;\n\n`;
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\nCOMMIT;\n`;

  fs.mkdirSync("mysql", { recursive: true });
  fs.writeFileSync("mysql/agrishare_mysql_phpmyadmin.sql", sql, "utf8");
  fs.writeFileSync("public/agrishare_mysql_phpmyadmin.sql", sql, "utf8");
  console.log("MySQL phpMyAdmin dump created successfully. Size:", sql.length, "bytes");

  client.release();
  await pool.end();
}

generate().catch(console.error);
