"use server";

import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { isSupabasePublicEnvConfigured } from "@/utils/supabase/env";

function getLocale(formData: FormData): string {
  const raw = String(formData.get("locale") ?? routing.defaultLocale);
  return hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
}

function getSafeNextPath(formData: FormData): string | null {
  const raw = String(formData.get("next") ?? "").trim();
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export async function signUp(formData: FormData) {
  const locale = getLocale(formData);
  const nextPath = getSafeNextPath(formData);

  if (!isSupabasePublicEnvConfigured()) {
    return redirect({
      href: { pathname: "/signup", query: { error: "env", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const transportType = String(formData.get("transport_type") ?? "").trim();

  if (!email || !password || !role || !firstName || !lastName || !phone) {
    return redirect({
      href: { pathname: "/signup", query: { error: "required_fields", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  if (role !== "client" && role !== "transporteur") {
    return redirect({
      href: { pathname: "/signup", query: { error: "invalid_role", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  if (password.length < 6) {
    return redirect({
      href: { pathname: "/signup", query: { error: "weak_password", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error("signUp auth error:", authError?.message);
    const msg = authError?.message?.toLowerCase() ?? "";
    let code = "auth_error";
    if (msg.includes("already registered")) code = "email_taken";
    else if (msg.includes("rate limit")) code = "rate_limit";

    if (code === "email_taken") {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) {
        return redirect({
          href: { pathname: "/signup", query: { error: "email_taken", ...(nextPath ? { next: nextPath } : {}) } },
          locale,
        });
      }
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      if (existingUser) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", existingUser.id)
          .maybeSingle();
        if (!existingProfile) {
          await supabase.from("profiles").insert({
            id: existingUser.id,
            role,
            first_name: firstName,
            last_name: lastName,
            phone,
            transport_type:
              role === "transporteur" ? transportType || null : null,
          });
        }
      }
      return redirect({ href: nextPath ?? "/", locale });
    }

    return redirect({
      href: { pathname: "/signup", query: { error: code, ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    role,
    first_name: firstName,
    last_name: lastName,
    phone,
    transport_type: role === "transporteur" ? transportType || null : null,
  });

  if (profileError) {
    console.error("signUp profile error:", profileError.message);
    return redirect({
      href: { pathname: "/signup", query: { error: "profile_error", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  return redirect({ href: nextPath ?? "/", locale });
}

export async function signIn(formData: FormData) {
  const locale = getLocale(formData);
  const nextPath = getSafeNextPath(formData);

  if (!isSupabasePublicEnvConfigured()) {
    return redirect({
      href: { pathname: "/login", query: { error: "env", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return redirect({
      href: { pathname: "/login", query: { error: "required_fields", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("signIn error:", error.message);
    return redirect({
      href: { pathname: "/login", query: { error: "invalid_credentials", ...(nextPath ? { next: nextPath } : {}) } },
      locale,
    });
  }

  return redirect({ href: nextPath ?? "/", locale });
}

export async function signOut(formData: FormData) {
  const locale = getLocale(formData);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return redirect({ href: "/", locale });
}
