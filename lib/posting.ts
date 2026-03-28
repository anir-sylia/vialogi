/**
 * Publication de nouvelles annonces (page /post + action serveur).
 * Désactivée par défaut. Pour réactiver : `NEXT_PUBLIC_POSTING_ENABLED=true` (Vercel / .env local).
 */
export function isPostingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_POSTING_ENABLED === "true";
}
