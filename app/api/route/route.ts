import { NextResponse } from "next/server";
import { haversineKm } from "@/lib/geo";

/** OSRM demo — pour la prod, hébergez votre propre instance ou un fournisseur payant. */
const OSRM_BASE =
  "https://router.project-osrm.org/route/v1/driving";

type OsrmResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { type: string; coordinates: [number, number][] };
  }>;
};

function toLeafletPositions(coords: [number, number][]): [number, number][] {
  return coords.map(([lon, lat]) => [lat, lon]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat1 = Number(searchParams.get("lat1"));
  const lon1 = Number(searchParams.get("lon1"));
  const lat2 = Number(searchParams.get("lat2"));
  const lon2 = Number(searchParams.get("lon2"));

  if (
    ![lat1, lon1, lat2, lon2].every((n) => Number.isFinite(n)) ||
    Math.abs(lat1) > 90 ||
    Math.abs(lat2) > 90 ||
    Math.abs(lon1) > 180 ||
    Math.abs(lon2) > 180
  ) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }

  const straightKm = haversineKm(lat1, lon1, lat2, lon2);
  const straightLine: [number, number][] = [
    [lat1, lon1],
    [lat2, lon2],
  ];

  try {
    const url = `${OSRM_BASE}/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({
        distanceKm: Math.round(straightKm * 10) / 10,
        durationMin: null,
        positions: straightLine,
        mode: "straight" as const,
      });
    }

    const data = (await res.json()) as OsrmResponse;
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) {
      return NextResponse.json({
        distanceKm: Math.round(straightKm * 10) / 10,
        durationMin: null,
        positions: straightLine,
        mode: "straight" as const,
      });
    }

    const route = data.routes[0];
    const positions = toLeafletPositions(route.geometry.coordinates);
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMin = Math.round(route.duration / 60);

    return NextResponse.json({
      distanceKm,
      durationMin,
      positions,
      mode: "road" as const,
    });
  } catch {
    return NextResponse.json({
      distanceKm: Math.round(straightKm * 10) / 10,
      durationMin: null,
      positions: straightLine,
      mode: "straight" as const,
    });
  }
}
