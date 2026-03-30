import type { SupabaseClient } from "@supabase/supabase-js";

async function collectInboxShipmentIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const allowed = new Set<string>();

  const { data: sent } = await supabase
    .from("messages")
    .select("shipment_id")
    .eq("sender_id", userId);
  for (const r of sent ?? []) {
    const sid = r.shipment_id as string;
    if (sid) allowed.add(sid);
  }

  const { data: owned } = await supabase
    .from("shipments")
    .select("id")
    .eq("user_id", userId);
  for (const r of owned ?? []) {
    const id = r.id as string;
    if (id) allowed.add(id);
  }

  const { data: assigned } = await supabase
    .from("shipments")
    .select("id")
    .eq("assigned_transporteur_id", userId);
  for (const r of assigned ?? []) {
    const id = r.id as string;
    if (id) allowed.add(id);
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("shipment_id")
    .eq("transporteur_id", userId);
  for (const r of offers ?? []) {
    const sid = r.shipment_id as string;
    if (sid) allowed.add(sid);
  }

  return Array.from(allowed);
}

export type InboxThread = {
  shipmentId: string;
  origin: string;
  destination: string;
  lastMessageAt: string;
  lastMessagePreview: string;
};

/**
 * Dernière activité par annonce, selon les messages visibles pour l’utilisateur (RLS).
 * Exclut les fils masqués tant qu’aucun message plus récent que `hidden_at`.
 */
export async function listMessageInboxThreads(
  supabase: SupabaseClient,
  userId: string,
): Promise<InboxThread[]> {
  const hiddenAtByShipment = new Map<string, string>();
  const { data: hiddenRows, error: hiddenErr } = await supabase
    .from("chat_inbox_hidden")
    .select("shipment_id, hidden_at")
    .eq("user_id", userId);

  if (hiddenErr) {
    console.error("chat_inbox_hidden:", hiddenErr.message);
  } else {
    for (const h of hiddenRows ?? []) {
      const sid = h.shipment_id as string;
      const at = h.hidden_at as string;
      hiddenAtByShipment.set(sid, at);
    }
  }

  /** Fils où l’utilisateur est réellement concerné (défense en profondeur côté app). */
  const allowedShipmentIds = await collectInboxShipmentIds(supabase, userId);
  if (allowedShipmentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      shipment_id,
      content,
      created_at,
      message_kind,
      media_url,
      shipments (
        id,
        origin,
        destination,
        status
      )
    `,
    )
    .in("shipment_id", allowedShipmentIds)
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

    const hiddenAt = hiddenAtByShipment.get(sid);
    const msgAt = row.created_at as string;
    if (
      hiddenAt &&
      new Date(msgAt).getTime() <= new Date(hiddenAt).getTime()
    ) {
      continue;
    }

    seen.add(sid);
    const content = (row.content as string) ?? "";
    const kind = (row as { message_kind?: string }).message_kind ?? "text";
    let preview = content;
    if (kind === "image") {
      preview = content.trim() ? `📷 ${content}` : "📷";
    } else if (kind === "audio") {
      preview = content.trim() ? `🎤 ${content}` : "🎤";
    } else if (preview.length > 120) {
      preview = `${preview.slice(0, 120)}…`;
    }
    threads.push({
      shipmentId: sid,
      origin: s.origin,
      destination: s.destination,
      lastMessageAt: row.created_at as string,
      lastMessagePreview: preview,
    });
  }

  return threads;
}
