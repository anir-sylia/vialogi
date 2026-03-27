"use server";

import type { User } from "@supabase/supabase-js";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  createSupabaseAnonServerClient,
  createSupabaseServerClient,
  createSupabaseServiceRoleClientIfConfigured,
} from "@/utils/supabase/server";
import { isSupabasePublicEnvConfigured } from "@/utils/supabase/env";

function fail(
  locale: string,
  code:
    | "required_fields"
    | "invalid_weight"
    | "invalid_price"
    | "db"
    | "profile_required"
    | "rls_denied"
    | "env"
    | "unknown_error",
) {
  return redirect({
    href: { pathname: "/post", query: { e: code } },
    locale,
  });
}

/** Create a minimal profile if auth user exists but `profiles` row is missing (FK + RLS need it). */
async function ensureUserProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: User,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (data) return true;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const first =
    typeof meta?.first_name === "string" ? meta.first_name : "Utilisateur";
  const last = typeof meta?.last_name === "string" ? meta.last_name : "-";
  const phone = typeof meta?.phone === "string" ? meta.phone : "+212000000000";

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    role: "client",
    first_name: first.slice(0, 100),
    last_name: last.slice(0, 100),
    phone: phone.slice(0, 32),
  });
  if (error) {
    console.error("ensureUserProfile insert:", error.message, error.code);
    return false;
  }
  return true;
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

  if (!isSupabasePublicEnvConfigured()) {
    return fail(locale, "env");
  }

  // Do not call redirect() inside try/catch — Next.js implements redirect via a
  // thrown error; catching it would turn real failures into `unknown_error`.
  let insertError: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null = null;
  try {
    const authSupabase = await createSupabaseServerClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (user) {
      const ok = await ensureUserProfile(authSupabase, user);
      if (!ok) {
        return fail(locale, "profile_required");
      }
    }

    const row = {
      origin,
      destination,
      weight_kg: weight,
      price,
      ...(user ? { user_id: user.id } : {}),
    };

    const supabase = user ? authSupabase : createSupabaseAnonServerClient();
    let { error } = await supabase.from("shipments").insert(row);

    if (error && user) {
      const svc = createSupabaseServiceRoleClientIfConfigured();
      if (svc) {
        const retry = await svc.from("shipments").insert(row);
        if (!retry.error) error = null;
        else error = retry.error;
      }
    }

    if (error) insertError = error;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      msg.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ||
      msg.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      msg.includes("Missing NEXT_PUBLIC_SUPABASE")
    ) {
      return fail(locale, "env");
    }
    console.error("submitShipment:", e);
    return fail(locale, "unknown_error");
  }

  if (insertError) {
    console.error(
      "submitShipment insert:",
      insertError.message,
      insertError.code,
      insertError.details,
      insertError.hint,
    );
    const msg = insertError.message?.toLowerCase() ?? "";
    if (
      msg.includes("row-level security") ||
      msg.includes("violates row-level") ||
      msg.includes("rls policy") ||
      msg.includes("permission denied") ||
      msg.includes("policy violation") ||
      insertError.code === "42501"
    ) {
      return fail(locale, "rls_denied");
    }
    if (insertError.code === "23503") {
      return fail(locale, "profile_required");
    }
    return fail(locale, "db");
  }

  return redirect({
    href: { pathname: "/", query: { posted: "1" } },
    locale,
  });
}
