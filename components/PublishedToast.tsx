"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PublishedToast() {
  const t = useTranslations("shipments");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (searchParams.get("posted") !== "1") return;

    handled.current = true;

    const next = new URLSearchParams(searchParams.toString());
    next.delete("posted");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);

    const show = window.setTimeout(() => {
      setVisible(true);
    }, 0);
    const hide = window.setTimeout(() => setVisible(false), 6000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [searchParams, pathname, router]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 start-1/2 z-[250] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-0 sm:start-auto sm:end-6 sm:translate-x-0 rtl:sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg ring-1 ring-emerald-500/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
        <p className="text-sm font-medium text-slate-800">{t("publishedToast")}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ms-auto shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={t("dismissToast")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
