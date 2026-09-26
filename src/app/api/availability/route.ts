import { reservationConflicts, suggestSlots } from "@/lib/queries";
import { fmtRange } from "@/lib/utils";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const equipmentId = Number(url.searchParams.get("equipmentId"));
  const start = new Date(String(url.searchParams.get("start")));
  const end = new Date(String(url.searchParams.get("end")));

  if (!equipmentId || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return Response.json({ available: false, conflicts: ["Invalid equipment or service period."], suggestions: [] }, { status: 400 });
  }

  const clashes = await reservationConflicts(equipmentId, start, end);
  const slots = clashes.length ? await suggestSlots(equipmentId, new Date(), 21) : [];

  return Response.json({
    available: clashes.length === 0,
    conflicts: clashes.map((c) => `${fmtRange(c.startAt, c.endAt)} — ${c.farmer ?? "reserved"} (${c.barangay ?? "—"})`),
    suggestions: slots.map((s) => fmtRange(s.start, s.end)),
    checkedAt: new Date().toISOString(),
  });
}
