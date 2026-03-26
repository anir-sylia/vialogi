import { createSupabaseAnonServerClient } from "@/utils/supabase/server";

export type ShipmentRow = {
  id: string;
  created_at: string;
  origin: string;
  destination: string;
  weight_kg: number;
  price: number;
};

/** Escape `%`, `_`, and `\` for PostgreSQL ILIKE patterns. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const DEFAULT_HOME_LIMIT = 6;
const SEARCH_RESULTS_LIMIT = 50;

/**
 * Latest shipments from Supabase. With a search term, filters `origin` and
 * `destination` with ILIKE and returns more rows.
 */
export async function listShipments(
  search: string | undefined | null,
  options?: { limit?: number },
) {
  try {
    const supabase = createSupabaseAnonServerClient();
    const q = (search?.trim() ?? "")
      .replace(/,/g, " ")
      .replace(/"/g, "");

    const hasSearch = q.length > 0;
    const limit =
      options?.limit ??
      (hasSearch ? SEARCH_RESULTS_LIMIT : DEFAULT_HOME_LIMIT);

    let query = supabase
      .from("shipments")
      .select("id, created_at, origin, destination, weight_kg, price")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (hasSearch) {
      const pattern = `%${escapeIlikePattern(q)}%`;
      query = query.or(
        `origin.ilike.${pattern},destination.ilike.${pattern}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("listShipments:", error.message, error.code, error.details);
      return [] as ShipmentRow[];
    }

    return (data ?? []) as ShipmentRow[];
  } catch (e) {
    console.error("listShipments:", e);
    return [] as ShipmentRow[];
  }
}

/** Total rows in `shipments` (for home stats). */
export async function countShipments(): Promise<number> {
  try {
    const supabase = createSupabaseAnonServerClient();
    const { count, error } = await supabase
      .from("shipments")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("countShipments:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.error("countShipments:", e);
    return 0;
  }
}

export async function getShipmentById(id: string): Promise<ShipmentRow | null> {
  try {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("id, created_at, origin, destination, weight_kg, price")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as ShipmentRow;
  } catch {
    return null;
  }
}
