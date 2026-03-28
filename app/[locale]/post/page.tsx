import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { PostShipmentForm } from "@/components/post/PostShipmentForm";
import { isPostingEnabled } from "@/lib/posting";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getProfile } from "@/lib/auth";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ e?: string | string[] }>;
};

const errorCodes = [
  "required_fields",
  "invalid_weight",
  "invalid_price",
  "db",
  "profile_required",
  "rls_denied",
  "missing_secret",
  "env",
  "unknown_error",
] as const;

type ErrorCode = (typeof errorCodes)[number];

function parseError(raw: string | string[] | undefined): ErrorCode | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return errorCodes.includes(v as ErrorCode) ? (v as ErrorCode) : null;
}

export default async function PostPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isPostingEnabled()) {
    return redirect({ href: "/", locale });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: { pathname: "/signup", query: { next: "/post" } }, locale });
  }

  const profile = await getProfile(user.id);
  const canPost = profile && ["client", "transporteur", "admin"].includes(profile.role);
  if (!canPost) {
    return redirect({ href: { pathname: "/signup", query: { next: "/post" } }, locale });
  }

  const sp = await searchParams;
  const errCode = parseError(sp?.e);

  const t = await getTranslations("postPage");
  const te = await getTranslations("postForm.errors");

  const errorMessage = errCode ? te(errCode) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("back")}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-[var(--text-muted)]">
        {t("subtitle")}
      </p>

      <PostShipmentForm locale={locale} serverError={errorMessage} />
    </div>
  );
}
