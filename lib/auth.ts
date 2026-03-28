import {
  createSupabaseAnonServerClient,
  createSupabaseServerClient,
  createSupabaseServiceRoleClientIfConfigured,
} from "@/utils/supabase/server";

export type Profile = {
  id: string;
  role: "client" | "transporteur" | "admin";
  first_name: string;
  last_name: string;
  phone: string;
  transport_type: string | null;
  points: number;
  total_transactions: number;
  avg_rating: number;
  created_at: string;
};

export type OfferRow = {
  id: string;
  shipment_id: string;
  transporteur_id: string;
  price: number;
  status: "pending" | "accepted" | "refused";
  created_at: string;
};

export type ReviewRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  shipment_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

/** Tous les profils client + transporteur (requête avec la session courante — réservé aux pages admin côté app). */
export async function listClientAndTransporteurProfiles(): Promise<Profile[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["client", "transporteur"])
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      ...row,
      points: row.points ?? 0,
      total_transactions: row.total_transactions ?? 0,
      avg_rating: row.avg_rating ?? 0,
    })) as Profile[];
  } catch {
    return [];
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      points: data.points ?? 0,
      total_transactions: data.total_transactions ?? 0,
      avg_rating: data.avg_rating ?? 0,
    } as Profile;
  } catch {
    return null;
  }
}

/**
 * RLS `offers_select` is TO authenticated only (owner or transporteur).
 * Must use the session client — anon sees zero rows.
 */
export async function getOffersForShipment(shipmentId: string): Promise<OfferRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getOffersForShipment:", error.message, error.code);
      return [];
    }
    return (data ?? []) as OfferRow[];
  } catch {
    return [];
  }
}

export async function getReviewsForShipment(shipmentId: string): Promise<ReviewRow[]> {
  try {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as ReviewRow[];
  } catch {
    return [];
  }
}

export async function getReviewsForUser(userId: string): Promise<ReviewRow[]> {
  try {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as ReviewRow[];
  } catch {
    return [];
  }
}

/**
 * Public home needs counts for all listed shipments; anon RLS cannot read `offers`.
 * Use service-role client when configured so counts are correct.
 */
export async function getOfferCountsForShipments(shipmentIds: string[]): Promise<Record<string, number>> {
  if (shipmentIds.length === 0) return {};
  try {
    const svc = createSupabaseServiceRoleClientIfConfigured();
    const supabase = svc ?? createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("offers")
      .select("shipment_id")
      .in("shipment_id", shipmentIds);
    if (error) {
      console.error("getOfferCountsForShipments:", error.message, error.code);
      return {};
    }
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.shipment_id] = (counts[row.shipment_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}
