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

const CITY_TYPES = new Set([
  "city",
  "town",
  "village",
  "locality",
  "municipality",
]);

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

function coordKey(f: PhotonFeature): string | null {
  const coords = f.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = coords[0];
  const lat = coords[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return `${lng.toFixed(4)},${lat.toFixed(4)}`;
}

/** Prefer first list for duplicate coordinates (e.g. Arabic name over French). */
function mergeDedupeFeatures(
  preferred: PhotonFeature[],
  secondary: PhotonFeature[],
): PhotonFeature[] {
  const seen = new Set<string>();
  const out: PhotonFeature[] = [];
  for (const f of preferred) {
    const k = coordKey(f);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  for (const f of secondary) {
    const k = coordKey(f);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}

async function fetchPhotonFeatures(
  q: string,
  lang: string,
  bboxParam: string,
): Promise<PhotonFeature[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=30&lang=${lang}${bboxParam}`;
  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) return [];
  const data = (await upstream.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
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

  let raw: PhotonFeature[];

  if (countryMa) {
    const [arFeatures, frFeatures] = await Promise.all([
      fetchPhotonFeatures(q, "ar", bboxParam),
      fetchPhotonFeatures(q, "fr", bboxParam),
    ]);
    const preferred = lang === "ar" ? arFeatures : frFeatures;
    const secondary = lang === "ar" ? frFeatures : arFeatures;
    raw = mergeDedupeFeatures(preferred, secondary);
  } else {
    raw = await fetchPhotonFeatures(q, lang, bboxParam);
  }

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
