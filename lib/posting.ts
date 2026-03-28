/**
 * Publication d’annonces : activée par défaut.
 * Pour désactiver (ex. maintenance) : `NEXT_PUBLIC_POSTING_ENABLED=false` sur Vercel / .env.
 */
export function isPostingEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_POSTING_ENABLED?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no") return false;
  return true;
}
