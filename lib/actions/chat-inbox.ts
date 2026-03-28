"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";

/** Retire la conversation de la liste « Mes messages » (pour cet utilisateur seulement). */
export async function hideInboxConversation(
  shipmentId: string,
  locale: string,
): Promise<{ ok: boolean }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    const { error } = await supabase.from("chat_inbox_hidden").upsert(
      {
        user_id: user.id,
        shipment_id: shipmentId,
        hidden_at: new Date().toISOString(),
      },
      { onConflict: "user_id,shipment_id" },
    );

    if (error) {
      console.error("hideInboxConversation:", error.message);
      return { ok: false };
    }

    revalidatePath(`/${locale}/messages`, "page");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
