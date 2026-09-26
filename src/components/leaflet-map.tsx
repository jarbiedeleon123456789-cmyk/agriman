"use client";

import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  detail?: string;
  emoji?: string;
  tone?: "farm" | "equipment" | "service" | "office";
};

const TONES: Record<string, string> = {
  farm: "#16a34a",
  equipment: "#0284c7",
  service: "#f59e0b",
  office: "#7c3aed",
};

function icon(emoji: string, tone: string) {
  return L.divIcon({
    className: "agrishare-pin",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50% 50% 50% 8%;transform:rotate(45deg);background:${tone};box-shadow:0 4px 10px rgba(0,0,0,.25);border:2px solid white"><span style="transform:rotate(-45deg);font-size:15px">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

export default function LeafletMap({
  markers,
  center = [13.3578, 121.1002],
  zoom = 12,
  height = 520,
  showDirections = false,
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  showDirections?: boolean;
}) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }} scrollWheelZoom className="z-0 rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={9000} pathOptions={{ color: "#047857", fillOpacity: 0.04, weight: 1, dashArray: "6 6" }} />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={icon(m.emoji ?? "📍", TONES[m.tone ?? "farm"])}>
          <Popup>
            <div style={{ minWidth: 190 }}>
              <strong style={{ fontSize: 13 }}>{m.title}</strong>
              {m.subtitle && <div style={{ fontSize: 12, color: "#475569" }}>{m.subtitle}</div>}
              {m.detail && <div style={{ fontSize: 12, marginTop: 4 }}>{m.detail}</div>}
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
              </div>
              {showDirections && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    background: "#047857",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  ➤ Get directions
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
