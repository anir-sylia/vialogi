import {
  createSupabaseAnonServerClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";

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

function mapShipmentRow(data: Record<string, unknown>): ShipmentRow {
  return {
    id: String(data.id),
    created_at: String(data.created_at),
    origin: String(data.origin),
    destination: String(data.destination),
    weight_kg: Number(data.weight_kg),
    price: Number(data.price),
    user_id: (data.user_id as string | null) ?? null,
    status: (data.status as ShipmentRow["status"]) ?? "open",
    assigned_transporteur_id:
      (data.assigned_transporteur_id as string | null) ?? null,
    removed_by: (data.removed_by as string | null) ?? null,
    removed_at: (data.removed_at as string | null) ?? null,
    removal_reason: (data.removal_reason as string | null) ?? null,
    parcel_photo_url: (data.parcel_photo_url as string | null) ?? null,
    parcel_description: (data.parcel_description as string | null) ?? null,
  };
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

    return mapShipmentRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Détail : annonces publiques, ou « retirées » si le visiteur est le propriétaire. */
export async function getShipmentForViewer(
  id: string,
  viewerUserId: string | null,
): Promise<ShipmentRow | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const row = mapShipmentRow(data as Record<string, unknown>);
    if (isPublicShipmentStatus(row.status)) return row;
    if (viewerUserId && row.user_id === viewerUserId) return row;
    if (
      viewerUserId &&
      row.assigned_transporteur_id === viewerUserId
    ) {
      return row;
    }
    return null;
  } catch {
    return null;
  }
}

/** Toutes les annonces du compte connecté (y compris retirées). */
export async function listShipmentsForAuthenticatedOwner(): Promise<
  ShipmentRow[]
> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(
        "listShipmentsForAuthenticatedOwner:",
        error.message,
        error.code,
      );
      return [];
    }

    return (data ?? []).map((r) =>
      mapShipmentRow(r as Record<string, unknown>),
    );
  } catch (e) {
    console.error("listShipmentsForAuthenticatedOwner:", e);
    return [];
  }
}
