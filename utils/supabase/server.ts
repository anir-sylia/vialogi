import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabasePublicEnvOrThrow,
  getSupabaseServiceRoleKey,
} from "@/utils/supabase/env";

/**
 * Server Actions / lectures anonymes — pas de `cookies()`.
 * `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
 */
export function createSupabaseAnonServerClient() {
  const { url, anonKey } = getSupabasePublicEnvOrThrow();
  return createClient(url, anonKey);
}

/**
 * Server Components avec session — mêmes vars + cookies Next.js.
 */
const emptyServerAuthStorage = {
  getItem: (key: string) => {
    void key;
    return null as string | null;
  },
  setItem: (key: string, value: string) => {
    void key;
    void value;
  },
  removeItem: (key: string) => {
    void key;
  },
};

/** Service-role client for server-only operations (bypasses RLS). Null if not configured. */
export function createSupabaseServiceRoleClientIfConfigured() {
  const { url } = getSupabasePublicEnvOrThrow();
  const key = getSupabaseServiceRoleKey();
  if (!key) return null;
  // Clés sb_secret_ : apikey + Authorization identiques (doc Supabase). Pas de session résiduelle.
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: emptyServerAuthStorage,
    },
    global: {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  });
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabasePublicEnvOrThrow();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
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
          /* Server Component sans droit de set cookie */
        }
      },
    },
  });
}
