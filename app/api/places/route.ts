import { NextResponse } from "next/server";

type PhotonFeature = {
  type: "Feature";
  properties: {
    name?: string;
    country?: string;
    state?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

const CITY_TYPES = new Set(["city", "town", "village"]);

function isCityLike(f: PhotonFeature): boolean {
  const t = f.properties.type;
  const v = f.properties.osm_value;
  if (t && CITY_TYPES.has(t)) return true;
  if (v && CITY_TYPES.has(v)) return true;
  if (f.properties.osm_key === "place" && v) return true;
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ places: [] });
  }

  const lang = searchParams.get("lang") === "ar" ? "ar" : "fr";

  const upstream = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=20&lang=${lang}`,
    { cache: "no-store" },
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as { features?: PhotonFeature[] };
  const raw = data.features ?? [];

  const filtered = raw
    .filter(isCityLike)
    .slice(0, 8)
    .map((f) => ({
      id: `${f.properties.name}-${f.properties.country}-${f.properties.state}`,
      name: f.properties.name ?? "",
      country: f.properties.country ?? "",
      state: f.properties.state ?? "",
      type: f.properties.type ?? f.properties.osm_value ?? "",
    }))
    .filter((p) => p.name.length > 0);

  return NextResponse.json({ places: filtered });
}
