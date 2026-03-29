"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import type { ShipmentRow } from "@/lib/shipments";
import { CityAutocompleteField } from "./CityAutocompleteField";
import { TransportShipmentCard } from "./TransportShipmentCard";

type Props = {
  shipments: ShipmentRow[];
  initialDeparture: string;
  initialArrival: string;
};

export function SearchRouteClient({
  shipments,
  initialDeparture,
  initialArrival,
}: Props) {
  const t = useTranslations("searchRoute");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();

  const [departure, setDeparture] = useState(initialDeparture);
  const [arrival, setArrival] = useState(initialArrival);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dep = departure.trim();
    const arr = arrival.trim();
    const params = new URLSearchParams();
    if (dep) params.set("dep", dep);
    if (arr) params.set("arr", arr);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t("resultsIntro")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <CityAutocompleteField
            id="search-departure"
            name="departure"
            value={departure}
            onChange={setDeparture}
            placeholder={t("departurePlaceholder")}
            label={t("departureLabel")}
            labelVisible
          />
          <CityAutocompleteField
            id="search-arrival"
            name="arrival"
            value={arrival}
            onChange={setArrival}
            placeholder={t("arrivalPlaceholder")}
            label={t("arrivalLabel")}
            labelVisible
          />
        </div>
        <p className="text-xs text-[var(--text-muted)]">{t("placesHint")}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          >
            {t("searchSubmit")}
          </button>
          <Link
            href="/post"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
          >
            {tNav("postAnnouncement")}
          </Link>
        </div>
      </form>

      <section className="mt-10" aria-labelledby="search-results-heading">
        <h2
          id="search-results-heading"
          className="mb-4 text-lg font-semibold text-[var(--text-primary)] sm:text-xl"
        >
          {t("resultsHeading")}
        </h2>
        {shipments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            {t("resultsEmpty")}
          </p>
        ) : (
          <ul className="space-y-6">
            {shipments.map((s) => (
              <TransportShipmentCard key={s.id} shipment={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
