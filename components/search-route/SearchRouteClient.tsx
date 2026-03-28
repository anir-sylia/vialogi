"use client";

import { useTranslations } from "next-intl";
import { useCallback, useId, useState } from "react";
import { Link } from "@/i18n/navigation";

const DUMMY_KEYS = ["1", "2", "3"] as const;

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function DummyShipmentCard({ id }: { id: (typeof DUMMY_KEYS)[number] }) {
  const t = useTranslations("searchRoute");
  const k = (suffix: string) => `dummy${id}${suffix}` as const;

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
        <h3 className="min-w-0 max-w-[min(100%,20rem)] text-base font-semibold text-[var(--text-primary)] sm:text-lg">
          {t(k("Title"))}
        </h3>
        <span className="shrink-0 rounded-lg bg-[var(--surface-muted)] px-2.5 py-1 text-sm font-bold text-[var(--text-primary)]">
          {t(k("Price"))}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-primary)]">
          {t(k("Origin"))}
        </span>
        <span className="text-[var(--text-muted)]" aria-hidden>
          →
        </span>
        <span className="font-medium text-[var(--text-primary)]">
          {t(k("Destination"))}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t(k("Dates"))}</p>
      <div className="mt-3">
        <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">
          {t(k("Size"))}
        </span>
      </div>
    </li>
  );
}

export function SearchRouteClient() {
  const t = useTranslations("searchRoute");
  const tInbox = useTranslations("inbox");
  const formId = useId();
  const depId = `${formId}-dep`;
  const arrId = `${formId}-arr`;

  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [stops, setStops] = useState<string[]>([]);

  const swap = useCallback(() => {
    const d = departure;
    const a = arrival;
    setDeparture(a);
    setArrival(d);
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
    /* Bientôt : filtrage réel côté API */
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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
        className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6"
        noValidate
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <label htmlFor={depId} className="sr-only">
              {t("departureLabel")}
            </label>
            <span className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-[var(--brand)]">
              <PinIcon className="h-5 w-5" />
            </span>
            <input
              id={depId}
              type="text"
              name="departure"
              autoComplete="off"
              placeholder={t("departurePlaceholder")}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 ps-11 pe-4 text-base text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] transition-shadow placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>

          <div className="flex justify-center py-0.5">
            <button
              type="button"
              onClick={swap}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--brand)] hover:bg-white hover:text-[var(--brand)]"
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

          <div className="relative">
            <label htmlFor={arrId} className="sr-only">
              {t("arrivalLabel")}
            </label>
            <span className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-[var(--brand)]">
              <PinIcon className="h-5 w-5" />
            </span>
            <input
              id={arrId}
              type="text"
              name="arrival"
              autoComplete="off"
              placeholder={t("arrivalPlaceholder")}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 ps-11 pe-4 text-base text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] transition-shadow placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>

          {stops.map((stop, index) => (
            <div key={index} className="relative flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-[var(--brand)]">
                  <PinIcon className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  value={stop}
                  onChange={(e) => updateStop(index, e.target.value)}
                  placeholder={t("stopPlaceholder", { n: index + 1 })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 ps-11 pe-4 text-base text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2"
                  aria-label={t("stopLabel", { n: index + 1 })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStop(index)}
                className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                aria-label={t("removeStopAria")}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addStop}
            className="self-start pt-1 text-start text-sm font-semibold text-[var(--brand)] hover:underline"
          >
            {t("addStop")}
          </button>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-[var(--brand)] py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          >
            {t("searchSubmit")}
          </button>
        </div>
      </form>

      <h2 className="mt-12 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
        {t("resultsHeading")}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t("dummyNote")}</p>

      <ul className="mt-6 flex flex-col gap-4">
        {DUMMY_KEYS.map((key) => (
          <DummyShipmentCard key={key} id={key} />
        ))}
      </ul>
    </div>
  );
}
