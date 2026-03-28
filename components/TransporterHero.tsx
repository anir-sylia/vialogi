"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function TransporterHero() {
  const t = useTranslations("heroTransport");

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand)] shadow-sm">
            {t("badge")}
          </p>
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/search-route"
              prefetch={true}
              className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
            >
              <svg
                className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
