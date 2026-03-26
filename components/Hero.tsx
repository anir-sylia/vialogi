"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

type Place = {
  id: string;
  name: string;
  country: string;
  state: string;
  type: string;
  lat?: number | null;
  lng?: number | null;
};

type HeroProps = {
  initialQuery?: string | null;
  /** Total rows in Supabase `shipments` (home stat). */
  totalShipments?: number;
};

export function Hero({ initialQuery = "", totalShipments = 0 }: HeroProps) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchPlaces = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setPlaces([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(q)}&lang=${locale}&country=ma`,
        );
        const data = (await res.json()) as { places?: Place[] };
        setPlaces(data.places ?? []);
      } catch {
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchPlaces(query.trim());
    }, 280);
    return () => window.clearTimeout(id);
  }, [query, fetchPlaces]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  function scrollToLoads() {
    requestAnimationFrame(() => {
      document.getElementById("loads")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function runSearch(next: string) {
    setQuery(next);
    const q = next.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    scrollToLoads();
  }

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand)] shadow-sm">
            {t("badge")}
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--text-muted)] sm:text-xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <label
            htmlFor="city-search"
            className="mb-2 block text-start text-sm font-medium text-[var(--text-primary)]"
          >
            {t("searchLabel")}
          </label>
          <div ref={wrapRef} className="relative">
            <input
              id="city-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3.5 text-base text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] transition-shadow placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2"
            />
            {loading ? (
              <div className="absolute end-3 top-1/2 -translate-y-1/2">
                <span
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]"
                  aria-hidden
                />
              </div>
            ) : null}

            {open && places.length > 0 ? (
              <ul
                className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg"
                role="listbox"
              >
                {places.map((p) => (
                  <li key={p.id} role="option">
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-start text-sm transition-colors hover:bg-[var(--surface-muted)]"
                      onClick={() => {
                        runSearch(
                          [p.name, p.state, p.country]
                            .filter(Boolean)
                            .join(", "),
                        );
                        setOpen(false);
                      }}
                    >
                      <span className="font-semibold text-[var(--text-primary)]">
                        {p.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {[p.state, p.country].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
            {t("searchHint")}
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => runSearch(query)}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto"
          >
            {t("ctaPrimary")}
          </button>
          <Link
            href="/#how"
            className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-8 py-3.5 text-base font-semibold text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] sm:w-auto"
          >
            {t("ctaSecondary")}
          </Link>
        </div>

        <div
          id="network"
          className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-[var(--border)] bg-white px-6 py-8 text-center shadow-sm">
            <div className="text-3xl font-bold text-[var(--brand)] sm:text-4xl">
              {totalShipments.toLocaleString(
                locale === "ar" ? "ar-MA" : "fr-FR",
              )}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--text-muted)]">
              {t("statsPublished")}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white px-6 py-8 text-center shadow-sm">
            <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {t("statsB2bBadge")}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--text-muted)]">
              {t("statsB2bHint")}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white px-6 py-8 text-center shadow-sm">
            <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {t("statsMoroccoBadge")}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--text-muted)]">
              {t("statsMoroccoHint")}
            </div>
          </div>
        </div>

        <div id="how" className="sr-only" aria-hidden />
        <div id="pricing" className="sr-only" aria-hidden />
        <div id="login" className="sr-only" aria-hidden />
      </div>
    </section>
  );
}
