import { createSupabaseAnonServerClient } from "@/utils/supabase/server";

export type ShipmentRow = {
  id: string;
  created_at: string;
  origin: string;
  destination: string;
  weight_kg: number;
  price: number;
  user_id: string | null;
  status: "open" | "assigned" | "completed" | "removed";
  assigned_transporteur_id: string | null;
  removed_by: string | null;
  removed_at: string | null;
  removal_reason: string | null;
  parcel_photo_url: string | null;
  parcel_description: string | null;
};

export const PUBLIC_SHIPMENT_STATUSES = ["open", "assigned", "completed"] as const;

export function isPublicShipmentStatus(
  status: ShipmentRow["status"],
): status is (typeof PUBLIC_SHIPMENT_STATUSES)[number] {
  return PUBLIC_SHIPMENT_STATUSES.includes(
    status as (typeof PUBLIC_SHIPMENT_STATUSES)[number],
  );
}

/** Escape `%`, `_`, and `\` for PostgreSQL ILIKE patterns. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const DEFAULT_HOME_LIMIT = 20;
const SEARCH_RESULTS_LIMIT = 50;

/**
 * Latest shipments from Supabase. With a search term, filters `origin` and
 * `origin` with ILIKE and returns more rows.
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

    // `*` évite l’erreur si la colonne `parcel_photo_url` n’existe pas encore (migration non appliquée).
    let query = supabase
      .from("shipments")
      .select("*")
      .in("status", [...PUBLIC_SHIPMENT_STATUSES])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (hasSearch) {
      const pattern = `%${escapeIlikePattern(q)}%`;
      query = query.ilike("origin", pattern);
    }

    const { data, error } = await query;

    if (error) {
      console.error("listShipments:", error.message, error.code, error.details);
      return [] as ShipmentRow[];
    }

    return (data ?? []).map((r) => ({
      ...(r as ShipmentRow),
      parcel_photo_url:
        (r as { parcel_photo_url?: string | null }).parcel_photo_url ?? null,
      parcel_description:
        (r as { parcel_description?: string | null }).parcel_description ?? null,
    })) as ShipmentRow[];
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
      .select("*", { count: "exact", head: true })
      .in("status", [...PUBLIC_SHIPMENT_STATUSES]);

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
      .select("*")
      .eq("id", id)
      .in("status", [...PUBLIC_SHIPMENT_STATUSES])
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      created_at: data.created_at,
      origin: data.origin,
      destination: data.destination,
      weight_kg: data.weight_kg,
      price: data.price,
      user_id: data.user_id ?? null,
      status: data.status ?? "open",
      assigned_transporteur_id: data.assigned_transporteur_id ?? null,
      removed_by: data.removed_by ?? null,
      removed_at: data.removed_at ?? null,
      removal_reason: data.removal_reason ?? null,
      parcel_photo_url: data.parcel_photo_url ?? null,
      parcel_description: data.parcel_description ?? null,
    } as ShipmentRow;
  } catch {
    return null;
  }
}
