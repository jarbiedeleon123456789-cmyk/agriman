import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./mysql-schema";

/**
 * MySQL Database Client for XAMPP / WAMP / phpMyAdmin
 *
 * To connect to MySQL / phpMyAdmin:
 * 1. Open XAMPP and start MySQL
 * 2. In .env set: DATABASE_URL="mysql://root:@127.0.0.1:3306/agrishare_db"
 * 3. Import `mysql/agrishare_mysql_phpmyadmin.sql` in phpMyAdmin
 */

const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

export function createMysqlConnection() {
  if (!mysqlUrl) {
    throw new Error("DATABASE_URL or MYSQL_URL is required to connect to MySQL");
  }

  const pool = mysql.createPool({
    uri: mysqlUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return drizzle(pool, { schema, mode: "default" });
}
