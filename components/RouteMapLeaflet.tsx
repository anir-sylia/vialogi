"use client";

import L from "leaflet";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function FitRouteBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;
    const b = L.latLngBounds(positions);
    map.fitBounds(b, { padding: [40, 40], maxZoom: 10 });
  }, [map, positions]);

  return null;
}

type Props = {
  positions: [number, number][];
  className?: string;
};

export default function RouteMapLeaflet({ positions, className }: Props) {
  const t = useTranslations("routePlanner");

  if (positions.length < 2) {
    return (
      <div
        className={`flex min-h-[280px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)] ${className ?? ""}`}
      >
        —
      </div>
    );
  }

  const start = positions[0];
  const end = positions[positions.length - 1];

  return (
    <MapContainer
      center={[31.5, -7.5]}
      zoom={6}
      className={`z-0 h-full min-h-[280px] w-full rounded-2xl ${className ?? ""}`}
      style={{ minHeight: 280 }}
      scrollWheelZoom
      aria-label={t("mapAria")}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: "#0d9488", weight: 5, opacity: 0.9 }}
      />
      <CircleMarker
        center={start}
        radius={9}
        pathOptions={{
          color: "#0f766e",
          fillColor: "#14b8a6",
          fillOpacity: 1,
          weight: 2,
        }}
      />
      <CircleMarker
        center={end}
        radius={9}
        pathOptions={{
          color: "#0f172a",
          fillColor: "#334155",
          fillOpacity: 1,
          weight: 2,
        }}
      />
      <FitRouteBounds positions={positions} />
    </MapContainer>
  );
}
