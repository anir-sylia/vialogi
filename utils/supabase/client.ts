import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnvOrThrow } from "@/utils/supabase/env";

/** Client browser — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicEnvOrThrow();
  return createBrowserClient(url, anonKey);
}
