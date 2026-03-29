"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ShipmentRow } from "@/lib/shipments";

function weightToSizeLetter(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) return "—";
  if (kg < 15) return "S";
  if (kg < 80) return "M";
  if (kg < 300) return "L";
  return "XL";
}

function formatPrice(amount: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} MAD`;
  }
}

function formatPublished(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  shipment: ShipmentRow;
};

export function TransportShipmentCard({ shipment: s }: Props) {
  const t = useTranslations("searchRoute");
  const locale = useLocale();

  const title =
    s.parcel_description?.trim() ||
    t("fallbackTitle", { origin: s.origin, destination: s.destination });

  return (
    <li className="border-b border-[var(--border)] pb-6 last:border-b-0 last:pb-0">
      <Link
        href={`/shipment/${s.id}`}
        className="group block rounded-lg outline-none ring-[var(--brand)] transition-colors focus-visible:ring-2"
      >
        <div className="flex gap-3 sm:gap-4">
          <div
            className="flex shrink-0 flex-col items-center pt-1"
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--brand)] bg-white shadow-sm" />
            <span className="my-1 min-h-[2.75rem] w-px flex-1 bg-[var(--border)] sm:min-h-[3rem]" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--brand)] bg-white shadow-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
              <h3 className="max-w-[min(100%,18rem)] text-base font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--brand)] sm:text-lg">
                {title}
              </h3>
              <span className="shrink-0 text-base font-bold text-[var(--brand)]">
                {formatPrice(Number(s.price), locale)}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-snug text-[var(--text-primary)]">
              {s.origin}
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-[var(--text-primary)]">
              {s.destination}
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {t("publishedOn", {
                date: formatPublished(s.created_at, locale),
              })}
            </p>
            <div className="mt-3 flex justify-end">
              <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">
                {weightToSizeLetter(Number(s.weight_kg))}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
