import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { MoroccoRoutePlanner } from "@/components/MoroccoRoutePlanner";
import { PublishedToast } from "@/components/PublishedToast";
import { ShipmentsSection } from "@/components/ShipmentsSection";
import { countShipments } from "@/lib/shipments";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const raw = sp?.q;
  const q = Array.isArray(raw) ? raw[0] : raw;

  const totalPublished = await countShipments();

  return (
    <>
      <Suspense fallback={null}>
        <PublishedToast />
      </Suspense>
      <Hero initialQuery={q} totalShipments={totalPublished} />
      <MoroccoRoutePlanner />
      <ShipmentsSection locale={locale} searchQuery={q} />
    </>
  );
}
