import { NextResponse } from "next/server";

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

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
  const results = (Array.isArray(data) ? data : []).map((r) => ({
    place_id: r.place_id,
    lat: Number(r.lat),
    lon: Number(r.lon),
    display_name: r.display_name,
  }));

  return NextResponse.json({ results });
}
