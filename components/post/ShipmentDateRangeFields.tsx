"use client";

import { addDays, format, parseISO } from "date-fns";
import { arSA, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { type ChangeEvent, useMemo, useState } from "react";

function ymd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function ShipmentDateRangeFields() {
  const t = useTranslations("postForm");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arSA : fr;

  const today = useMemo(() => startOfToday(), []);
  const defaultMax = useMemo(() => addDays(today, 7), [today]);

  const [minStr, setMinStr] = useState(() => ymd(today));
  const [maxStr, setMaxStr] = useState(() => ymd(defaultMax));

  const todayStr = ymd(today);

  const onMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    setMinStr(v);
    if (maxStr < v) setMaxStr(v);
  };

  const onMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    if (v < minStr) setMaxStr(minStr);
    else setMaxStr(v);
  };

  const summary = useMemo(() => {
    try {
      const from = format(parseISO(minStr), "d MMM", { locale: dateLocale });
      const to = format(parseISO(maxStr), "d MMM yyyy", { locale: dateLocale });
      return t("dateRangeBetween", { from, to });
    } catch {
      return "";
    }
  }, [minStr, maxStr, dateLocale, t]);

  const inputCls =
    "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2";

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 px-4 py-4">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {summary}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{t("dateRangeHint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="pickup_available_from"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            {t("dateFrom")}
          </label>
          <input
            id="pickup_available_from"
            name="pickup_available_from"
            type="date"
            required
            value={minStr}
            min={todayStr}
            onChange={onMinChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="deliver_by"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            {t("dateTo")}
          </label>
          <input
            id="deliver_by"
            name="deliver_by"
            type="date"
            required
            value={maxStr}
            min={minStr}
            onChange={onMaxChange}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
