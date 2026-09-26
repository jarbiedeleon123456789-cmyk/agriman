import Link from "next/link";
import { Badge, Banner, Card, btn } from "@/components/ui";
import MapView from "@/components/map-view";
import type { MapMarker } from "@/components/leaflet-map";
import { listBarangays, listEquipment, listReservations, settingsMap } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtRange } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";

export const dynamic = "force-dynamic";

export default async function PublicMapPage({
  searchParams,
}: {
  searchParams: Promise<{ layer?: string; barangay?: string }>;
}) {
  const sp = await searchParams;
  const layer = sp.layer ?? "all";
  const [barangays, equipment, reservations, user, cfg] = await Promise.all([
    listBarangays(),
    listEquipment(),
    listReservations({ from: new Date() }),
    getCurrentUser(),
    settingsMap(),
  ]);

  const markers: MapMarker[] = [];

  markers.push({
    id: "mao-office",
    lat: 13.3578,
    lng: 121.1002,
    title: "Municipal Agriculture Office of Baco",
    subtitle: "MAO Motorpool & Post-Harvest Facility",
    detail: cfg.office_address,
    emoji: "🏛️",
    tone: "office",
  });

  if (layer === "all" || layer === "barangay") {
    for (const b of barangays) {
      if (sp.barangay && sp.barangay !== "all" && String(b.id) !== sp.barangay) continue;
      markers.push({
        id: `b-${b.id}`,
        lat: Number(b.lat),
        lng: Number(b.lng),
        title: `Barangay ${b.name}`,
        subtitle: `${b.municipality}, ${b.province}`,
        detail: `Registered farmland: ${b.farmlandHa} ha`,
        emoji: "🏘️",
        tone: "farm",
      });
    }
  }

  if (layer === "all" || layer === "equipment") {
    for (const e of equipment) {
      if (!e.lat || !e.lng) continue;
      markers.push({
        id: `e-${e.id}`,
        lat: Number(e.lat),
        lng: Number(e.lng),
        title: e.name,
        subtitle: `${e.assetCode} · ${e.status}`,
        detail: e.location,
        emoji: e.icon ?? "🚜",
        tone: "equipment",
      });
    }
  }

  if (layer === "all" || layer === "service") {
    for (const r of reservations) {
      if (!r.farmLat || !r.farmLng) continue;
      markers.push({
        id: `r-${r.id}`,
        lat: Number(r.farmLat),
        lng: Number(r.farmLng),
        title: `${r.serviceType} service destination`,
        subtitle: `${r.equipmentName ?? ""} · ${r.status}`,
        detail: `${fmtRange(r.startAt, r.endAt)} · Brgy. ${r.barangay ?? "—"}`,
        emoji: "📌",
        tone: "service",
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHero
        eyebrow="GIS · Leaflet + OpenStreetMap"
        title="Farm & service map"
        sub="Barangay clusters, equipment stations and upcoming service destinations across Baco, Oriental Mindoro."
        emoji="🗺️"
        actions={[
          ["all", "All layers"],
          ["barangay", "Barangays"],
          ["equipment", "Equipment"],
          ["service", "Service destinations"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/map?layer=${value}`}
            className={
              layer === value
                ? "rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-emerald-950 transition hover:bg-lime-200"
                : "rounded-full border border-white/25 px-4 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            }
          >
            {label}
          </Link>
        ))}
      />

      <div className="mb-4">
        <Banner tone="info" title="Privacy notice">
          Individual farmer names and exact household locations are never shown on the public map. Detailed farm plots
          and directions are available only to authenticated MAO personnel, assigned operators and the farm owner.
          {!user && (
            <>
              {" "}
              <Link href="/login" className="font-semibold underline">
                Sign in
              </Link>{" "}
              to open the operational map.
            </>
          )}
        </Banner>
      </div>

      <Card className="!p-3">
        <MapView markers={markers} height={560} showDirections={Boolean(user)} />
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card title="🗺️ Legend">
          <ul className="space-y-2 text-sm text-slate-600">
            <li>🏛️ MAO office / motorpool</li>
            <li>🏘️ Barangay agricultural cluster</li>
            <li>🚜 Equipment home station</li>
            <li>📌 Upcoming service destination</li>
          </ul>
        </Card>
        <Card title="📦 Mapped equipment">
          <ul className="space-y-2">
            {equipment.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-slate-700">{e.name}</span>
                <Badge value={e.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="🚚 Driver / technician tools">
          <p className="text-sm text-slate-600">
            Assigned drivers and technicians can open each destination marker and tap <strong>Get directions</strong> to
            launch turn-by-turn navigation for the farm coordinates.
          </p>
          <Link href="/dashboard/assignments" className="mt-3 inline-block text-sm font-bold text-emerald-700 hover:underline">
            Open my assignments →
          </Link>
        </Card>
      </div>
    </div>
  );
}
