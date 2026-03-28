"use server";

import { randomUUID } from "node:crypto";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const BUCKET = "profile-photos";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

type Err = "invalid_photo" | "forbidden" | "db";

function fail(locale: string, profileId: string, code: Err) {
  return redirect({
    href: { pathname: `/profile/${profileId}`, query: { e: code } },
    locale,
  });
}

export async function uploadProfilePhoto(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? routing.defaultLocale);
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const kind = String(formData.get("kind") ?? "");
  if (kind !== "avatar" && kind !== "transport") {
    const pid = String(formData.get("profile_user_id") ?? "").trim();
    if (pid) return fail(locale, pid, "invalid_photo");
    return redirect({ href: "/", locale });
  }

  const profileUserId = String(formData.get("profile_user_id") ?? "").trim();
  const raw = formData.get("photo");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  if (!profileUserId || !file) {
    return profileUserId
      ? fail(locale, profileUserId, "invalid_photo")
      : redirect({ href: "/", locale });
  }

  if (file.size > MAX_BYTES || !ALLOWED.has(file.type)) {
    return fail(locale, profileUserId, "invalid_photo");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  if (user.id !== profileUserId) {
    return fail(locale, profileUserId, "forbidden");
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (kind === "transport" && prof?.role !== "transporteur") {
    return fail(locale, profileUserId, "forbidden");
  }

  const ext = extFromMime(file.type);
  const path = `${user.id}/${kind}-${randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (upErr) {
    console.error("uploadProfilePhoto:", upErr.message);
    return fail(locale, profileUserId, "db");
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const column = kind === "avatar" ? "avatar_url" : "transport_photo_url";
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ [column]: publicUrl })
    .eq("id", user.id);

  if (updErr) {
    console.error("profile photo update:", updErr.message);
    return fail(locale, profileUserId, "db");
  }

  return redirect({ href: `/profile/${user.id}`, locale });
}
