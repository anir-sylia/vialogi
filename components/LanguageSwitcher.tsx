"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("language");

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-white/80 p-0.5 shadow-sm"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <Link
            key={loc}
            href={pathname}
            locale={loc}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
              active
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            }`}
            hrefLang={loc}
          >
            {t(loc)}
          </Link>
        );
      })}
    </div>
  );
}
