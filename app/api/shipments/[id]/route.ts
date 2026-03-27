import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { canRemoveShipment, sanitizeRemovalReason } from "@/lib/moderation";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 20;
const deleteRate = new Map<string, { count: number; startedAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const current = deleteRate.get(userId);
  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    deleteRate.set(userId, { count: 1, startedAt: now });
    return false;
  }
  if (current.count >= RATE_LIMIT_PER_WINDOW) return true;
  current.count += 1;
  return false;
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/shipments/[id]">,
) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (shipmentError || !shipment || shipment.status === "removed") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (
    !canRemoveShipment({
      actorId: user.id,
      actorRole: profile.role,
      ownerId: shipment.user_id,
    })
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let reason: string | null = null;
  try {
    const body = (await request.json()) as { reason?: unknown };
    reason = sanitizeRemovalReason(body?.reason);
  } catch {
    reason = null;
  }

  const { error: updateError } = await supabase
    .from("shipments")
    .update({
      status: "removed",
      removed_by: user.id,
      removed_at: new Date().toISOString(),
      removal_reason: reason,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  if (profile.role === "admin") {
    await supabase.from("moderation_logs").insert({
      annonce_id: id,
      admin_id: user.id,
      action: "remove",
      reason,
    });
  }

  return NextResponse.json({ success: true });
}
