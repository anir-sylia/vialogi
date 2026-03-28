"use client";

import { useTranslations } from "next-intl";
import { useCallback, useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  CityAutocompleteField,
  type ResolvedPlace,
} from "@/components/search-route/CityAutocompleteField";

const DUMMY_KEYS = ["1", "2", "3"] as const;

function DummyShipmentCard({ id }: { id: (typeof DUMMY_KEYS)[number] }) {
  const t = useTranslations("searchRoute");
  const k = (suffix: string) => `dummy${id}${suffix}` as const;

  return (
    <li className="border-b border-[var(--border)] pb-6 last:border-b-0 last:pb-0">
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
            <h3 className="max-w-[min(100%,18rem)] text-base font-semibold leading-snug text-[var(--text-primary)] sm:text-lg">
              {t(k("Title"))}
            </h3>
            <span className="shrink-0 text-base font-bold text-[var(--brand)]">
              {t(k("Price"))}
            </span>
          </div>
          <p className="mt-3 text-sm font-medium leading-snug text-[var(--text-primary)]">
            {t(k("Origin"))}
          </p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-[var(--text-primary)]">
            {t(k("Destination"))}
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">{t(k("Dates"))}</p>
          <div className="mt-3 flex justify-end">
            <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">
              {t(k("Size"))}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function SearchRouteClient() {
  const t = useTranslations("searchRoute");
  const tInbox = useTranslations("inbox");
  const baseId = useId();
  const depId = `${baseId}-dep`;
  const arrId = `${baseId}-arr`;

  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const departureCoordRef = useRef<ResolvedPlace | null>(null);
  const arrivalCoordRef = useRef<ResolvedPlace | null>(null);
  const [stops, setStops] = useState<string[]>([]);

  const swap = useCallback(() => {
    const d = departure;
    const a = arrival;
    setDeparture(a);
    setArrival(d);
    const dp = departureCoordRef.current;
    const ap = arrivalCoordRef.current;
    departureCoordRef.current = ap;
    arrivalCoordRef.current = dp;
  }, [departure, arrival]);

  const addStop = useCallback(() => {
    setStops((s) => [...s, ""]);
  }, []);

  const removeStop = useCallback((index: number) => {
    setStops((s) => s.filter((_, i) => i !== index));
  }, []);

  const updateStop = useCallback((index: number, value: string) => {
    setStops((s) => {
      const next = [...s];
      next[index] = value;
      return next;
    });
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    /* Bientôt : API avec departureCoordRef / arrivalCoordRef (lat/lng Photon) */
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6 lg:max-w-3xl lg:px-8">
      <Link
        href="/"
        className="inline-flex text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {tInbox("backHome")}
      </Link>

      <h1 className="mt-6 text-balance text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
        {t("pageTitle")}
      </h1>

      <form
        onSubmit={onSubmit}
        className="mt-8"
        noValidate
      >
        <div className="flex flex-row items-stretch gap-2 sm:gap-3">
          <div
            className="flex w-7 shrink-0 flex-col items-center pt-3 sm:w-8"
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--brand)] bg-white shadow-sm ring-1 ring-[var(--border)]" />
            <span className="my-1 min-h-[3rem] w-px flex-1 bg-[var(--border)] sm:min-h-[3.25rem]" />
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--brand)] bg-white shadow-sm ring-1 ring-[var(--border)]" />
          </div>

          <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] bg-[var(--surface)]">
              <CityAutocompleteField
                id={depId}
                name="departure"
                label={t("departureLabel")}
                placeholder={t("departurePlaceholder")}
                value={departure}
                onChange={setDeparture}
                onResolvedPlace={(p) => {
                  departureCoordRef.current = p;
                }}
              />
            </div>
            <div className="bg-[var(--surface)]">
              <CityAutocompleteField
                id={arrId}
                name="arrival"
                label={t("arrivalLabel")}
                placeholder={t("arrivalPlaceholder")}
                value={arrival}
                onChange={setArrival}
                onResolvedPlace={(p) => {
                  arrivalCoordRef.current = p;
                }}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center self-center py-6">
            <button
              type="button"
              onClick={swap}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
              aria-label={t("swapAria")}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--text-muted)] sm:text-start">
          {t("placesHint")}
        </p>

        {stops.map((stop, index) => (
          <div
            key={index}
            className="mt-4 flex items-stretch gap-2 sm:gap-3"
          >
            <div className="w-7 shrink-0 sm:w-8" aria-hidden />
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <CityAutocompleteField
                id={`${baseId}-stop-${index}`}
                name={`stop_${index}`}
                label={t("stopLabel", { n: index + 1 })}
                placeholder={t("stopPlaceholder", { n: index + 1 })}
                value={stop}
                onChange={(v) => updateStop(index, v)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeStop(index)}
              className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-[var(--border)] bg-white text-lg leading-none text-[var(--text-muted)] shadow-sm hover:bg-[var(--surface-muted)]"
              aria-label={t("removeStopAria")}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addStop}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] bg-white py-3 text-sm font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t("addStop")}
        </button>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-[var(--brand)] py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        >
          {t("searchSubmit")}
        </button>
      </form>

      <h2 className="mt-12 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
        {t("resultsHeading")}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t("dummyNote")}</p>

      <ul className="mt-6 flex flex-col rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
        {DUMMY_KEYS.map((key) => (
          <DummyShipmentCard key={key} id={key} />
        ))}
      </ul>
    </div>
  );
}
