import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("postPage");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("back")}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--text-muted)]">
        {t("subtitle")}
      </p>
    </div>
  );
}
