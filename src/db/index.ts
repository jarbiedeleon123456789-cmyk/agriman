import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./mysql-schema";

const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!databaseUrl && !isProductionBuild) {
  throw new Error("MYSQL_URL or DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __agriShareMysqlPool?: ReturnType<typeof mysql.createPool>;
};

export const pool =
  globalForDb.__agriShareMysqlPool ??
  mysql.createPool({
    ...(databaseUrl ? { uri: databaseUrl } : {}),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__agriShareMysqlPool = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
