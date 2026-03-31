import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ForgotPasswordForm } from "./reset-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

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
        {t("forgotTitle")}
      </h1>
      <p className="mt-2 text-[var(--text-muted)]">{t("forgotSubtitle")}</p>

      <ForgotPasswordForm locale={locale === "ar" ? "ar" : "fr"} />
    </div>
  );
}

