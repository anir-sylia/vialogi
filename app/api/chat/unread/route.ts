import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const { data, error } = await supabase.rpc("count_unread_chat_messages");

    if (error) {
      console.error("count_unread_chat_messages:", error.message, error.code);
      return NextResponse.json({ count: 0 });
    }

    const n = typeof data === "number" ? data : Number(data ?? 0);
    return NextResponse.json({ count: Number.isFinite(n) ? Math.min(n, 999) : 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
