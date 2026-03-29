import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { SearchRouteClient } from "@/components/search-route/SearchRouteClient";
import { listShipmentsForTransportSearch } from "@/lib/shipments";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ dep?: string | string[]; arr?: string | string[] }>;
};

function firstString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? "").trim();
  return (v ?? "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "searchRoute" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SearchRoutePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const dep = firstString(sp.dep);
  const arr = firstString(sp.arr);

  const shipments = await listShipmentsForTransportSearch(dep || undefined, arr || undefined);

  return (
    <SearchRouteClient
      shipments={shipments}
      initialDeparture={dep}
      initialArrival={arr}
    />
  );
}
