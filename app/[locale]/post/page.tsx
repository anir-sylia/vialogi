import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PostShipmentForm } from "@/components/post/PostShipmentForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ e?: string | string[] }>;
};

const errorCodes = [
  "required_fields",
  "invalid_weight",
  "invalid_price",
  "db",
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
