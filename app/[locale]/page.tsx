import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/Hero";
import { MoroccoRoutePlanner } from "@/components/MoroccoRoutePlanner";
import { ShipmentsSection } from "@/components/ShipmentsSection";

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

  return (
    <>
      <Hero initialQuery={q} />
      <MoroccoRoutePlanner />
      <ShipmentsSection locale={locale} searchQuery={q} />
    </>
  );
}
