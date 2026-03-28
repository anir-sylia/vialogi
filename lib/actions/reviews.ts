"use server";

import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";

function getLocale(formData: FormData): string {
  const raw = String(formData.get("locale") ?? routing.defaultLocale);
  return hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
}

export async function submitReview(formData: FormData) {
  const locale = getLocale(formData);
  const shipmentId = String(formData.get("shipment_id") ?? "").trim();
  const toUserId = String(formData.get("to_user_id") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const rating = parseInt(ratingRaw, 10);

  if (!shipmentId || !toUserId || isNaN(rating) || rating < 1 || rating > 5) {
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: "invalid_review" } },
      locale,
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect({ href: "/login", locale });

  if (toUserId === user.id) {
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: "cannot_review_self" } },
      locale,
    });
  }

  const { error } = await supabase.from("reviews").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    shipment_id: shipmentId,
    rating,
    comment: comment || null,
  });

  if (error) {
    console.error("submitReview error:", error.message);
    const code = error.message?.includes("duplicate") ? "already_reviewed" : "review_failed";
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: code } },
      locale,
    });
  }

  await supabase.rpc("recalc_avg_rating", { target_id: toUserId });

  return redirect({
    href: { pathname: `/shipment/${shipmentId}`, query: { success: "review_sent" } },
    locale,
  });
}
