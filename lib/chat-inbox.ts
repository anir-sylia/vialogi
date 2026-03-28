import type { SupabaseClient } from "@supabase/supabase-js";

export type InboxThread = {
  shipmentId: string;
  origin: string;
  destination: string;
  lastMessageAt: string;
  lastMessagePreview: string;
};

/**
 * Dernière activité par annonce, selon les messages visibles pour l’utilisateur (RLS).
 */
export async function listMessageInboxThreads(
  supabase: SupabaseClient,
): Promise<InboxThread[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      shipment_id,
      content,
      created_at,
      shipments (
        id,
        origin,
        destination,
        status
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    console.error("listMessageInboxThreads:", error.message);
    return [];
  }

  const rows = data ?? [];
  const seen = new Set<string>();
  const threads: InboxThread[] = [];

  for (const row of rows) {
    const sid = row.shipment_id as string;
    if (seen.has(sid)) continue;

    const ship = row.shipments as
      | { id: string; origin: string; destination: string; status: string }
      | null
      | Array<{ id: string; origin: string; destination: string; status: string }>;

    const s = Array.isArray(ship) ? ship[0] : ship;
    if (!s?.id) continue;

    seen.add(sid);
    const content = (row.content as string) ?? "";
    threads.push({
      shipmentId: sid,
      origin: s.origin,
      destination: s.destination,
      lastMessageAt: row.created_at as string,
      lastMessagePreview:
        content.length > 120 ? `${content.slice(0, 120)}…` : content,
    });
  }

  return threads;
}
