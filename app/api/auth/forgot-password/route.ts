import { NextResponse } from "next/server";
import { createSupabaseAnonServerClient } from "@/utils/supabase/server";

type Body = {
  email?: string;
  locale?: string;
};

function safeLocale(raw: unknown): "fr" | "ar" {
  return raw === "ar" ? "ar" : "fr";
}

function safeEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function getOrigin(request: Request): string {
  const h = request.headers;
  const proto = h.get("x-forwarded-proto");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (proto && host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

/** Si défini (ex. https://www.vialogi.com sur Vercel), force le redirectTo Supabase — évite mismatch www/apex ou headers proxy. */
function getPublicOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return getOrigin(request);
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as Body;
    const email = safeEmail(raw.email);
    const locale = safeLocale(raw.locale);

    // Always return 200 to avoid user enumeration.
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseAnonServerClient();
    const origin = getPublicOrigin(request);
    const redirectTo = `${origin}/${locale}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("forgot-password resetPasswordForEmail:", error.message, {
        redirectTo,
      });
      // Même réponse pour toutes les erreurs (config, rate limit, SMTP…) — pas d’énumération utilisateur.
      return NextResponse.json(
        { ok: false },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot-password:", e);
    return NextResponse.json({ ok: true });
  }
}
