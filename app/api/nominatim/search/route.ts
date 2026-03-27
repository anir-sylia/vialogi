import { NextResponse } from "next/server";

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

/** Short label for UI: city/town + optional region — not the full OSM display_name. */
function shortPlaceLabel(
  address: Record<string, string> | undefined,
  displayName: string,
): string {
  if (address) {
    const main =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.county ||
      address.state_district ||
      "";
    const region = address.state || address.region || "";
    if (main && region && main.trim() !== region.trim()) {
      return `${main.trim()}, ${region.trim()}`;
    }
    if (main) return main.trim();
  }
  const parts = displayName
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 2) return displayName.trim();
  return `${parts[0]}, ${parts[1]}`;
}

/**
 * Proxy Nominatim (usage policy: identify app via User-Agent).
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const lang = searchParams.get("lang") === "ar" ? "ar" : "fr";

  if (q.length < 2) {
    return NextResponse.json({ results: [] as NominatimItem[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", lang);

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Vialogi/1.0 (freight logistics; contact: https://vialogi.com)",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "nominatim_failed" },
      { status: 502 },
    );
  }

  const data = (await res.json()) as NominatimItem[];
  const results = (Array.isArray(data) ? data : []).map((r) => {
    const label = shortPlaceLabel(r.address, r.display_name);
    return {
      place_id: r.place_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
      display_name: r.display_name,
      label,
    };
  });

  return NextResponse.json({ results });
}
