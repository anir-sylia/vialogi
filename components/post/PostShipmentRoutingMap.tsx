"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = [number, number];

function RoutingMachine({
  origin,
  destination,
  onDistanceKm,
}: {
  origin: LatLng;
  destination: LatLng;
  onDistanceKm: (km: number | null) => void;
}) {
  const map = useMap();
  const onDistanceRef = useRef(onDistanceKm);
  onDistanceRef.current = onDistanceKm;

  const addedRef = useRef<L.Control | null>(null);
  const [o0, o1] = origin;
  const [d0, d1] = destination;

  useEffect(() => {
    let cancelled = false;

    onDistanceRef.current(null);
    if (addedRef.current) {
      try {
        map.removeControl(addedRef.current);
      } catch {
        /* ignore */
      }
      addedRef.current = null;
    }

    void (async () => {
      if (typeof window !== "undefined") {
        (window as unknown as { L: typeof L }).L = L;
      }
      await import("leaflet-routing-machine/dist/leaflet-routing-machine.css");
      await import("leaflet-routing-machine");
      if (cancelled) return;

      const LR = L as unknown as {
        Routing: {
          control: (o: Record<string, unknown>) => L.Control & {
            on: (ev: string, fn: (e: unknown) => void) => unknown;
          };
          osrmv1: (o: Record<string, unknown>) => unknown;
        };
      };

      const control = LR.Routing.control({
        waypoints: [
          L.latLng(o0, o1),
          L.latLng(d0, d1),
        ],
        router: LR.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: "#0d9488", weight: 5, opacity: 0.92 }],
        },
        createMarker: () => false,
      });

      const instance = control.addTo(map);
      if (cancelled) {
        try {
          map.removeControl(instance);
        } catch {
          /* ignore */
        }
        return;
      }
      addedRef.current = instance;

      control.on("routesfound", (e: unknown) => {
        const ev = e as {
          routes?: Array<{ summary?: { totalDistance?: number } }>;
        };
        const d = ev.routes?.[0]?.summary?.totalDistance;
        if (typeof d === "number") {
          onDistanceRef.current(Math.round((d / 1000) * 10) / 10);
        }
      });
      control.on("routingerror", () => onDistanceRef.current(null));
    })();

    return () => {
      cancelled = true;
      const ac = addedRef.current;
      if (ac) {
        try {
          map.removeControl(ac);
        } catch {
          /* ignore */
        }
        addedRef.current = null;
      }
      onDistanceRef.current(null);
    };
  }, [o0, o1, d0, d1, map]);

  return null;
}

type Props = {
  origin: LatLng | null;
  destination: LatLng | null;
  onDistanceKm: (km: number | null) => void;
  emptyLabel: string;
};

export default function PostShipmentRoutingMap({
  origin,
  destination,
  onDistanceKm,
  emptyLabel,
}: Props) {
  const center: LatLng = origin ?? destination ?? [31.5, -7.5];
  const zoom = origin && destination ? 6 : origin || destination ? 9 : 6;
  const ready = Boolean(origin && destination);

  return (
    <div className="relative h-full min-h-[240px] w-full sm:min-h-[280px] lg:min-h-[420px]">
      <MapContainer
        center={center}
        zoom={zoom}
        className="z-0 h-full min-h-[240px] w-full rounded-2xl border border-[var(--border)] sm:min-h-[280px] lg:min-h-[420px]"
        scrollWheelZoom
        aria-label="Route"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {ready ? (
          <RoutingMachine
            origin={origin!}
            destination={destination!}
            onDistanceKm={onDistanceKm}
          />
        ) : null}
      </MapContainer>
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/95 text-center text-sm text-[var(--text-muted)]">
          {emptyLabel}
        </div>
      ) : null}
    </div>
  );
}
