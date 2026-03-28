"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";

/** Marque la conversation comme lue (badge + compteur non lus). */
export async function markChatRead(shipmentId: string): Promise<{ ok: boolean }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    const { error } = await supabase.from("chat_read_state").upsert(
      {
        user_id: user.id,
        shipment_id: shipmentId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,shipment_id" },
    );

    if (error) {
      console.error("markChatRead:", error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
