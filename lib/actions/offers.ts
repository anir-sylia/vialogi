"use server";

import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";

function getLocale(formData: FormData): string {
  const raw = String(formData.get("locale") ?? routing.defaultLocale);
  return hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
}

export async function submitOffer(formData: FormData) {
  const locale = getLocale(formData);
  const shipmentId = String(formData.get("shipment_id") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = parseFloat(priceRaw);

  if (!shipmentId || isNaN(price) || price <= 0) {
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: "invalid_price" } },
      locale,
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const { error } = await supabase.from("offers").insert({
    shipment_id: shipmentId,
    transporteur_id: user.id,
    price,
  });

  if (error) {
    console.error("submitOffer error:", error.message);
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: "offer_failed" } },
      locale,
    });
  }

  return redirect({
    href: { pathname: `/shipment/${shipmentId}`, query: { success: "offer_sent" } },
    locale,
  });
}

export async function acceptOffer(formData: FormData) {
  const locale = getLocale(formData);
  const offerId = String(formData.get("offer_id") ?? "").trim();
  const shipmentId = String(formData.get("shipment_id") ?? "").trim();

  if (!offerId || !shipmentId) {
    return redirect({ href: `/shipment/${shipmentId}`, locale });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect({ href: "/login", locale });

  const { data: offer } = await supabase
    .from("offers")
    .select("id, transporteur_id, status")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer || offer.status !== "pending") {
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: "offer_invalid" } },
      locale,
    });
  }

  const { error: acceptErr } = await supabase
    .from("offers")
    .update({ status: "accepted" })
    .eq("id", offerId);

  if (acceptErr) {
    console.error("acceptOffer error:", acceptErr.message);
    return redirect({
      href: { pathname: `/shipment/${shipmentId}`, query: { error: "accept_failed" } },
      locale,
    });
  }

  await supabase
    .from("offers")
    .update({ status: "refused" })
    .eq("shipment_id", shipmentId)
    .neq("id", offerId)
    .eq("status", "pending");

  await supabase
    .from("shipments")
    .update({ status: "assigned", assigned_transporteur_id: offer.transporteur_id })
    .eq("id", shipmentId);

  await supabase.rpc("increment_profile_stats", { target_id: user.id });
  await supabase.rpc("increment_profile_stats", { target_id: offer.transporteur_id });

  return redirect({
    href: { pathname: `/shipment/${shipmentId}`, query: { success: "offer_accepted" } },
    locale,
  });
}

export async function refuseOffer(formData: FormData) {
  const locale = getLocale(formData);
  const offerId = String(formData.get("offer_id") ?? "").trim();
  const shipmentId = String(formData.get("shipment_id") ?? "").trim();

  if (!offerId || !shipmentId) {
    return redirect({ href: `/shipment/${shipmentId}`, locale });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect({ href: "/login", locale });

  await supabase
    .from("offers")
    .update({ status: "refused" })
    .eq("id", offerId);

  return redirect({
    href: { pathname: `/shipment/${shipmentId}`, query: { success: "offer_refused" } },
    locale,
  });
}
