import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnvOrThrow } from "@/utils/supabase/env";

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
