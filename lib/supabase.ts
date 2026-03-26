/**
 * Point d’entrée historique — implémentation dans `utils/supabase/*`.
 */
export { createSupabaseBrowserClient } from "@/utils/supabase/client";
export {
  createSupabaseAnonServerClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
export { isSupabasePublicEnvConfigured } from "@/utils/supabase/env";
