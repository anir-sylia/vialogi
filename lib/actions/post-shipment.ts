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
import {
  getSupabaseServiceRoleKey,
  isSupabasePublicEnvConfigured,
} from "@/utils/supabase/env";
import { isPostingEnabled } from "@/lib/posting";

function pgCode(err: { code?: string }): string {
  return String(err.code ?? "");
}

function isRlsOrPermissionError(err: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (err.message ?? "").toLowerCase();
  const code = pgCode(err);
  return (
    code === "42501" ||
    code === "PGRST301" ||
    msg.includes("row-level security") ||
    msg.includes("violates row-level") ||
    msg.includes("rls policy") ||
    msg.includes("permission denied") ||
    msg.includes("policy violation") ||
    msg.includes("pgrst301") ||
    msg.includes("new row violates") ||
    msg.includes("violates check constraint")
  );
}

function isInvalidServiceRoleOrJwtError(err: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (err.message ?? "").toLowerCase();
  return (
    msg.includes("invalid api key") ||
    (msg.includes("jwt") && msg.includes("invalid")) ||
    (msg.includes("signature") && msg.includes("invalid"))
  );
}

function fail(
  locale: string,
  code:
    | "required_fields"
    | "invalid_weight"
    | "invalid_price"
    | "db"
    | "profile_required"
    | "rls_denied"
    | "missing_secret"
    | "env"
    | "unknown_error"
    | "bad_service_key",
) {
  return redirect({
    href: { pathname: "/post", query: { e: code } },
    locale,
  });
}

/** Create a minimal profile if auth user exists but `profiles` row is missing (FK + RLS need it). */
async function ensureUserProfile(
  authSupabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: User,
): Promise<boolean> {
  const { data } = await authSupabase
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

  const profileRow = {
    id: user.id,
    role: "client" as const,
    first_name: first.slice(0, 100),
    last_name: last.slice(0, 100),
    phone: phone.slice(0, 32),
  };

  let { error } = await authSupabase.from("profiles").insert(profileRow);
  if (error) {
    const svc = createSupabaseServiceRoleClientIfConfigured();
    if (svc) {
      const r2 = await svc.from("profiles").insert(profileRow);
      if (!r2.error) return true;
      error = r2.error;
    }
  } else {
    return true;
  }

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

  if (!isPostingEnabled()) {
    return redirect({ href: "/", locale });
  }

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
  let authedUser: User | null = null;
  try {
    const authSupabase = await createSupabaseServerClient();
    let { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      const { data: sess } = await authSupabase.auth.getSession();
      user = sess.session?.user ?? null;
    }
    authedUser = user ?? null;

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

    if (user) {
      // 1) Insert avec le JWT utilisateur (RLS OK si script 008 / politiques à jour).
      // 2) Secours : service_role si la clé est configurée (ex. clé erronée avant : on tente quand même le JWT).
      const svc = createSupabaseServiceRoleClientIfConfigured();
      const { error: authInsertErr } = await authSupabase
        .from("shipments")
        .insert(row);
      if (!authInsertErr) {
        insertError = null;
      } else if (svc) {
        const { error: svcErr } = await svc.from("shipments").insert(row);
        if (!svcErr) {
          insertError = null;
        } else if (
          isInvalidServiceRoleOrJwtError(svcErr) &&
          !isInvalidServiceRoleOrJwtError(authInsertErr)
        ) {
          insertError = authInsertErr;
          console.error(
            "submitShipment: service_role key rejected, surfacing auth error instead",
            svcErr.message,
          );
        } else {
          insertError = svcErr;
          console.error("submitShipment: auth insert failed, service_role also failed", {
            auth: authInsertErr.message,
            service: svcErr.message,
          });
        }
      } else {
        insertError = authInsertErr;
      }
    } else {
      const { error } = await createSupabaseAnonServerClient()
        .from("shipments")
        .insert(row);
      if (error) insertError = error;
    }
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
    if (isRlsOrPermissionError(insertError)) {
      return fail(locale, "rls_denied");
    }
    if (pgCode(insertError) === "23503") {
      return fail(locale, "profile_required");
    }
    if (pgCode(insertError) === "23502") {
      return fail(locale, "profile_required");
    }
    if (authedUser && getSupabaseServiceRoleKey() && isInvalidServiceRoleOrJwtError(insertError)) {
      return fail(locale, "bad_service_key");
    }
    if (authedUser && !getSupabaseServiceRoleKey()) {
      return fail(locale, "missing_secret");
    }
    return fail(locale, "db");
  }

  return redirect({
    href: { pathname: "/", query: { posted: "1" } },
    locale,
  });
}
