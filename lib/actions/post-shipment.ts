"use server";

import { randomUUID } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * ~1,5 Mo par fichier × 3 ≤ plafond corps requête Vercel (~4,5 Mo) + marge multipart.
 */
const MAX_PARCEL_PHOTO_BYTES = Math.floor((4.5 * 1024 * 1024) / 3);
const MAX_PARCEL_PHOTOS = 3;
const ALLOWED_PARCEL_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PARCEL_PHOTOS_BUCKET = "parcel-photos";

function pgCode(err: { code?: string }): string {
  return String(err.code ?? "");
}

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
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
    msg.includes("pgrst301") ||
    msg.includes("row-level security policy") ||
    msg.includes("row level security policy") ||
    msg.includes("violates row-level security") ||
    msg.includes("rls policy")
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

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidYmd(s: string): boolean {
  if (!YMD_RE.test(s)) return false;
  const t = Date.parse(`${s}T12:00:00.000Z`);
  return !Number.isNaN(t);
}

function fail(
  locale: string,
  code:
    | "required_fields"
    | "invalid_weight"
    | "invalid_price"
    | "invalid_photo"
    | "invalid_dates"
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

async function uploadParcelPhotosAndUpdateRow(
  client: SupabaseClient,
  shipmentId: string,
  files: File[],
): Promise<void> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = extFromMime(file.type);
    const path = `${shipmentId}/${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const { error: upErr } = await client.storage
      .from(PARCEL_PHOTOS_BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });
    if (upErr) {
      console.error("uploadParcelPhoto:", upErr.message);
      continue;
    }
    const { data: pub } = client.storage
      .from(PARCEL_PHOTOS_BUCKET)
      .getPublicUrl(path);
    urls.push(pub.publicUrl);
  }
  if (urls.length === 0) return;
  const { error: updErr } = await client
    .from("shipments")
    .update({
      parcel_photo_urls: urls,
      parcel_photo_url: urls[0] ?? null,
    })
    .eq("id", shipmentId);
  if (updErr) {
    console.error("parcel_photo_urls update:", updErr.message);
  }
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
  const parcelDescriptionRaw = String(
    formData.get("parcel_description") ?? "",
  ).trim();
  const parcel_description =
    parcelDescriptionRaw.length > 0
      ? parcelDescriptionRaw.slice(0, 2000)
      : null;

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

  const pickupRaw = String(formData.get("pickup_available_from") ?? "").trim();
  const deliverRaw = String(formData.get("deliver_by") ?? "").trim();
  if (!isValidYmd(pickupRaw) || !isValidYmd(deliverRaw)) {
    return fail(locale, "invalid_dates");
  }
  const today = utcTodayYmd();
  if (pickupRaw < today || deliverRaw < pickupRaw) {
    return fail(locale, "invalid_dates");
  }

  if (!isSupabasePublicEnvConfigured()) {
    return fail(locale, "env");
  }

  const rawPhotos = formData.getAll("parcel_photos");
  const photoFiles: File[] = [];
  for (const item of rawPhotos) {
    if (item instanceof File && item.size > 0) {
      photoFiles.push(item);
      if (photoFiles.length >= MAX_PARCEL_PHOTOS) break;
    }
  }

  let insertError: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null = null;
  let authedUser: User | null = null;
  let insertedId: string | null = null;
  let authSupabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null =
    null;

  try {
    authSupabase = await createSupabaseServerClient();
    let { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      const { data: sess } = await authSupabase.auth.getSession();
      user = sess.session?.user ?? null;
    }
    authedUser = user ?? null;

    if (photoFiles.length > 0) {
      if (!user) {
        photoFiles.length = 0;
      } else {
        for (const f of photoFiles) {
          if (
            f.size > MAX_PARCEL_PHOTO_BYTES ||
            !ALLOWED_PARCEL_PHOTO_TYPES.has(f.type)
          ) {
            return fail(locale, "invalid_photo");
          }
        }
      }
    }

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
      status: "open" as const,
      pickup_available_from: pickupRaw,
      deliver_by: deliverRaw,
      ...(parcel_description ? { parcel_description } : {}),
      ...(user ? { user_id: user.id } : {}),
    };

    if (user) {
      const svc = createSupabaseServiceRoleClientIfConfigured();
      if (svc) {
        const { data: d1, error: svcErr } = await svc
          .from("shipments")
          .insert(row)
          .select("id")
          .single();
        if (!svcErr && d1?.id) {
          insertedId = d1.id;
          insertError = null;
        } else if (svcErr) {
          const { data: d2, error: authErr } = await authSupabase
            .from("shipments")
            .insert(row)
            .select("id")
            .single();
          if (!authErr && d2?.id) {
            insertedId = d2.id;
            insertError = null;
          } else {
            insertError = authErr ?? svcErr;
            console.error("submitShipment: service_role + auth insert both failed", {
              service: svcErr.message,
              auth: authErr?.message,
            });
          }
        }
      } else {
        const { data: d, error: authErr } = await authSupabase
          .from("shipments")
          .insert(row)
          .select("id")
          .single();
        if (!authErr && d?.id) {
          insertedId = d.id;
          insertError = null;
        } else {
          insertError = authErr ?? null;
        }
      }
    } else {
      const { data: d, error } = await createSupabaseAnonServerClient()
        .from("shipments")
        .insert(row)
        .select("id")
        .single();
      if (!error && d?.id) {
        insertedId = d.id;
        insertError = null;
      } else {
        insertError = error;
      }
    }

    if (
      !insertError &&
      insertedId &&
      photoFiles.length > 0 &&
      user &&
      authSupabase
    ) {
      const svc = createSupabaseServiceRoleClientIfConfigured();
      const uploadClient = svc ?? authSupabase;
      await uploadParcelPhotosAndUpdateRow(
        uploadClient,
        insertedId,
        photoFiles,
      );
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
    if (pgCode(insertError) === "23514") {
      return fail(locale, "db");
    }
    if (
      authedUser &&
      getSupabaseServiceRoleKey() &&
      isInvalidServiceRoleOrJwtError(insertError)
    ) {
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
