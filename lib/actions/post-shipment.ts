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

/** ≤4MB: Vercel serverless request body max ~4.5MB; multipart overhead needs margin. */
const MAX_PARCEL_PHOTO_BYTES = 4 * 1024 * 1024;
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

function fail(
  locale: string,
  code:
    | "required_fields"
    | "invalid_weight"
    | "invalid_price"
    | "invalid_photo"
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

async function uploadParcelPhotoAndUpdateRow(
  client: SupabaseClient,
  shipmentId: string,
  file: File,
): Promise<void> {
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
    return;
  }
  const { data: pub } = client.storage
    .from(PARCEL_PHOTOS_BUCKET)
    .getPublicUrl(path);
  const publicUrl = pub.publicUrl;
  const { error: updErr } = await client
    .from("shipments")
    .update({ parcel_photo_url: publicUrl })
    .eq("id", shipmentId);
  if (updErr) {
    console.error("parcel_photo_url update:", updErr.message);
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

  const rawPhoto = formData.get("parcel_photo");
  let photoFile: File | null = null;
  if (rawPhoto instanceof File && rawPhoto.size > 0) {
    photoFile = rawPhoto;
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

    if (photoFile) {
      if (!user) {
        photoFile = null;
      } else if (
        photoFile.size > MAX_PARCEL_PHOTO_BYTES ||
        !ALLOWED_PARCEL_PHOTO_TYPES.has(photoFile.type)
      ) {
        return fail(locale, "invalid_photo");
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
      photoFile &&
      user &&
      authSupabase
    ) {
      const svc = createSupabaseServiceRoleClientIfConfigured();
      const uploadClient = svc ?? authSupabase;
      await uploadParcelPhotoAndUpdateRow(uploadClient, insertedId, photoFile);
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
