/**
 * Seules variables d'environnement Supabase utilisées par l'app (Vercel / local).
 * Toute lecture `process.env` liée à Supabase doit passer par ce module.
 *
 * Supports both the newer NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
 * and the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function isSupabasePublicEnvConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  return Boolean(url && anonKey);
}

/** Pour les factories client/serveur quand l'appelant a déjà vérifié la config. */
export function getSupabasePublicEnvOrThrow(): {
  url: string;
  anonKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    );
  }
  return { url, anonKey };
}
