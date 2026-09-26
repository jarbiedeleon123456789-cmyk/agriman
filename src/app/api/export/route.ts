import { getCurrentUser, isMao } from "@/lib/session";
import { listEquipment, listFarmers, listRequests, listReservations } from "@/lib/queries";
import { fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function csv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const v = cell === null || cell === undefined ? "" : String(cell);
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(","),
    )
    .join("\n");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (!isMao(user.role) && user.role !== "auditor")) {
    return new Response("Forbidden", { status: 403 });
  }
  const type = new URL(request.url).searchParams.get("type") ?? "requests";
  let rows: (string | number | null | undefined)[][] = [];
  let name = type;

  if (type === "requests") {
    const data = await listRequests();
    rows = [
      ["Code", "Farmer", "Service", "Equipment/Resource", "Barangay", "Requested start", "Requested end", "Area (ha)", "Priority", "Status", "Filed"],
      ...data.map((r) => [
        r.code,
        r.farmerName,
        r.serviceType,
        r.equipmentName ?? r.resourceName,
        r.barangay,
        fmtDateTime(r.requestedStart),
        fmtDateTime(r.requestedEnd),
        r.areaHa,
        r.priority,
        r.status,
        fmtDateTime(r.createdAt),
      ]),
    ];
  } else if (type === "equipment") {
    const data = await listEquipment();
    rows = [
      ["Asset code", "Name", "Category", "Status", "Condition", "Station", "Rate per ha", "Next maintenance"],
      ...data.map((e) => [e.assetCode, e.name, e.category, e.status, e.condition, e.location, e.ratePerHa, e.nextMaintenanceDue]),
    ];
    name = "equipment-inventory";
  } else if (type === "schedule") {
    const data = await listReservations();
    rows = [
      ["Equipment", "Asset code", "Service", "Start", "End", "Barangay", "Farm", "Operator", "Status", "Harvester"],
      ...data.map((r) => [
        r.equipmentName,
        r.assetCode,
        r.serviceType,
        fmtDateTime(r.startAt),
        fmtDateTime(r.endAt),
        r.barangay,
        r.farmName,
        r.operatorName,
        r.status,
        r.isHarvester ? "Yes" : "No",
      ]),
    ];
  } else if (type === "farmers") {
    const data = await listFarmers();
    rows = [
      ["Name", "RSBSA", "Barangay", "Association", "Main crop", "Area (ha)", "Phone", "Email", "Status"],
      ...data.map((f) => [f.name, f.rsbsaNumber, f.barangay, f.association, f.mainCrop, f.totalAreaHa, f.phone, f.email, f.status]),
    ];
  } else {
    return new Response("Unknown report type", { status: 400 });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agrishare-${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
