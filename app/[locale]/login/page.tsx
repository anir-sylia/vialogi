import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signIn } from "@/lib/actions/auth";
import { LoginForm } from "./login-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const errorCode = Array.isArray(sp?.error) ? sp.error[0] : sp?.error;

  const t = await getTranslations("auth");
  const te = await getTranslations("auth.errors");

  const validErrors = ["required_fields", "invalid_credentials", "env"] as const;
  type LoginError = (typeof validErrors)[number];
  const errorMessage =
    errorCode && validErrors.includes(errorCode as LoginError)
      ? te(errorCode as LoginError)
      : null;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("backHome")}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {t("loginTitle")}
      </h1>
      <p className="mt-2 text-[var(--text-muted)]">
        {t("loginSubtitle")}
      </p>

      {errorMessage ? (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <LoginForm locale={locale} action={signIn} />

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {t("noAccount")}{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--brand)] hover:underline"
        >
          {t("signupLink")}
        </Link>
      </p>
    </div>
  );
}
