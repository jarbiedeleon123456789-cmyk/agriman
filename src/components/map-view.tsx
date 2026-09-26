"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-xl border border-dashed border-emerald-900/20 bg-emerald-50/50 text-sm font-semibold text-emerald-700">
      Loading map of Baco, Oriental Mindoro…
    </div>
  ),
});

export default function MapView(props: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  showDirections?: boolean;
}) {
  return <LeafletMap {...props} />;
}
