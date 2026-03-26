import { createSupabaseServerClient } from "@/lib/supabase";

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

const HOME_SHIPMENTS_LIMIT = 6;

export async function listShipments(
  search: string | undefined | null,
  options?: { limit?: number },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const q = (search?.trim() ?? "")
      .replace(/,/g, " ")
      .replace(/"/g, "");

    const limit = options?.limit ?? HOME_SHIPMENTS_LIMIT;

    let query = supabase
      .from("shipments")
      .select("id, created_at, origin, destination, weight_kg, price")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q.length > 0) {
      const pattern = `%${escapeIlikePattern(q)}%`;
      query = query.or(
        `origin.ilike.${pattern},destination.ilike.${pattern}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("listShipments:", error.message);
      return [] as ShipmentRow[];
    }

    return (data ?? []) as ShipmentRow[];
  } catch (e) {
    console.error("listShipments:", e);
    return [] as ShipmentRow[];
  }
}

export async function getShipmentById(id: string): Promise<ShipmentRow | null> {
  try {
    const supabase = await createSupabaseServerClient();
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
