import { createClient } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase is configured exclusively via public env vars (safe for the browser):
 * - `NEXT_PUBLIC_SUPABASE_URL`
 * - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 */
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv() {
  const url = NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return { supabaseUrl: url, supabaseAnonKey: anonKey };
}

/** Client Components — anon key from env; picks up auth cookies when you add login. */
export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = requireEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server Actions / API sans session — même clé `anon`, sans `cookies()`.
 * À utiliser pour insert/lecture anonymes ; évite les erreurs fréquentes avec
 * `createServerClient` + `cookies()` dans certaines Server Actions (ex. Vercel).
 */
export function createSupabaseAnonServerClient() {
  const { supabaseUrl, supabaseAnonKey } = requireEnv();
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Server Components, Route Handlers — env + Next.js cookies (sessions / auth). */
export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = requireEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* ignore when called from a Server Component that cannot set cookies */
        }
      },
    },
  });
}
