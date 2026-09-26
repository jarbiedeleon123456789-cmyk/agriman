import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await ensureSeeded();
    return Response.json({ ok: true, app: "AgriShare", office: "Municipal Agriculture Office of Baco" });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
