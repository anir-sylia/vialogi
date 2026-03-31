import { NextResponse } from "next/server";
import { Resend } from "resend";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import { createSupabaseServiceRoleClientIfConfigured } from "@/utils/supabase/server";

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

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as Body;
    const email = safeEmail(raw.email);
    const locale = safeLocale(raw.locale);

    // Always return 200 to avoid user enumeration.
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseServiceRoleClientIfConfigured();
    if (!supabase) {
      console.error("forgot-password: missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ ok: true });
    }

    const origin = getOrigin(request);
    const redirectTo = `${origin}/${locale}/reset-password`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.hashed_token) {
      console.error("forgot-password generateLink:", error?.message);
      return NextResponse.json({ ok: true });
    }

    const tokenHash = data.properties.hashed_token;
    const resetUrl = `${redirectTo}?token=${encodeURIComponent(tokenHash)}`;

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.error("forgot-password: missing RESEND_API_KEY");
      return NextResponse.json({ ok: true });
    }

    const resend = new Resend(apiKey);

    const subject =
      locale === "ar"
        ? "استرجاع كلمة السر - فيالوجي"
        : "Réinitialisation de votre mot de passe - ViaLogi";

    const from =
      process.env.RESEND_FROM?.trim() || "ViaLogi <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: email,
      subject,
      react: ResetPasswordEmail({ locale, resetUrl }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot-password:", e);
    return NextResponse.json({ ok: true });
  }
}

