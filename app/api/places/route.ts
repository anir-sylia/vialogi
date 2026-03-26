import { NextResponse } from "next/server";

type PhotonFeature = {
  type: "Feature";
  geometry?: {
    type: string;
    coordinates: number[];
  };
  properties: {
    name?: string;
    country?: string;
    countrycode?: string;
    state?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

const CITY_TYPES = new Set(["city", "town", "village"]);

/** Maroc — bbox Photon: minLon, minLat, maxLon, maxLat */
const MA_BBOX = "-17.3,20.7,-0.9,36.2";

function isCityLike(f: PhotonFeature): boolean {
  const t = f.properties.type;
  const v = f.properties.osm_value;
  if (t && CITY_TYPES.has(t)) return true;
  if (v && CITY_TYPES.has(v)) return true;
  if (f.properties.osm_key === "place" && v) return true;
  return false;
}

function isMorocco(f: PhotonFeature): boolean {
  const c = f.properties.countrycode?.toUpperCase();
  if (c === "MA") return true;
  const name = f.properties.country?.toLowerCase() ?? "";
  return (
    name.includes("morocco") ||
    name.includes("maroc") ||
    name.includes("المغرب")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ places: [] });
  }

  const lang = searchParams.get("lang") === "ar" ? "ar" : "fr";
  const countryMa = searchParams.get("country") === "ma";

  const bboxParam = countryMa ? `&bbox=${MA_BBOX}` : "";

  const upstream = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=30&lang=${lang}${bboxParam}`,
    { cache: "no-store" },
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as { features?: PhotonFeature[] };
  let raw = data.features ?? [];

  raw = raw.filter(isCityLike);
  if (countryMa) {
    raw = raw.filter(isMorocco);
  }

  const filtered = raw
    .map((f) => {
      const coords = f.geometry?.coordinates;
      const lng = Array.isArray(coords) ? coords[0] : undefined;
      const lat = Array.isArray(coords) ? coords[1] : undefined;
      return {
        id: `${f.properties.name}-${f.properties.country}-${f.properties.state}-${lat}-${lng}`,
        name: f.properties.name ?? "",
        country: f.properties.country ?? "",
        state: f.properties.state ?? "",
        type: f.properties.type ?? f.properties.osm_value ?? "",
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
      };
    })
    .filter((p) => p.name.length > 0 && p.lat != null && p.lng != null)
    .slice(0, 8);

  return NextResponse.json({ places: filtered });
}
