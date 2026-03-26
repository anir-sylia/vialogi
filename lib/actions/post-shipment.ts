"use server";

import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase";

function fail(
  locale: string,
  code:
    | "required_fields"
    | "invalid_weight"
    | "invalid_price"
    | "db"
    | "unknown_error",
) {
  return redirect({
    href: { pathname: "/post", query: { e: code } },
    locale,
  });
}

/** Inserts a row into `public.shipments` using the Supabase server client (env anon key). */
export async function submitShipment(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? routing.defaultLocale);
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const origin = String(formData.get("origin") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!origin || !destination) {
    return fail(locale, "required_fields");
  }

  const weight = Number(weightRaw.replace(",", "."));
  const price = Number(priceRaw.replace(",", "."));

  if (!Number.isFinite(weight) || weight <= 0) {
    return fail(locale, "invalid_weight");
  }
  if (!Number.isFinite(price) || price < 0) {
    return fail(locale, "invalid_price");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("shipments").insert({
      origin,
      destination,
      weight_kg: weight,
      price,
    });

    if (error) {
      console.error("submitShipment insert:", error.message);
      return fail(locale, "db");
    }
  } catch (e) {
    console.error("submitShipment:", e);
    return fail(locale, "unknown_error");
  }

  return redirect({ href: "/", locale });
}
