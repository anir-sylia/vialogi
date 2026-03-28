import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { SearchRouteClient } from "@/components/search-route/SearchRouteClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "searchRoute" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SearchRoutePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SearchRouteClient />;
}
