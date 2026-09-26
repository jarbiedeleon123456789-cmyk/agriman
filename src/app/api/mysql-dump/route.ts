import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = path.join(process.cwd(), "mysql", "agrishare_mysql_phpmyadmin.sql");
  if (!fs.existsSync(filePath)) {
    return new Response("Dump file not found", { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return new Response(content, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agrishare_mysql_phpmyadmin.sql"',
    },
  });
}
