"use server";

import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createSupabaseAnonServerClient } from "@/lib/supabase";

function fail(
  locale: string,
  code:
    | "required_fields"
    | "invalid_weight"
    | "invalid_price"
    | "db"
    | "env"
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

  // Do not call redirect() inside try/catch — Next.js implements redirect via a
  // thrown error; catching it would turn real failures into `unknown_error`.
  let insertError: { message: string } | null = null;
  try {
    const supabase = createSupabaseAnonServerClient();
    const { error } = await supabase.from("shipments").insert({
      origin,
      destination,
      weight_kg: weight,
      price,
    });
    if (error) insertError = error;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("NEXT_PUBLIC_SUPABASE")) {
      return fail(locale, "env");
    }
    console.error("submitShipment:", e);
    return fail(locale, "unknown_error");
  }

  if (insertError) {
    console.error("submitShipment insert:", insertError.message);
    return fail(locale, "db");
  }

  return redirect({ href: "/", locale });
}
