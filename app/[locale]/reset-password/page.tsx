import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ResetPasswordClient } from "./reset-password-client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? "").trim();
  return (v ?? "").trim();
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const token = firstString(sp.token);

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Link
        href="/login"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("resetBackLogin")}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {t("resetTitle")}
      </h1>
      <p className="mt-2 text-[var(--text-muted)]">{t("resetSubtitle")}</p>

      <ResetPasswordClient
        locale={locale === "ar" ? "ar" : "fr"}
        tokenHash={token}
      />
    </div>
  );
}

