"use client";

import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useState,
} from "react";

type Props = {
  urls: string[];
  /** Titre du bandeau du lightbox (ex. trajet). */
  title: string;
};

export function ParcelPhotoGallery({ urls, title }: Props) {
  const t = useTranslations("shipmentDetail");
  const labelId = useId();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const current = urls[safeIndex] ?? "";

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setLightboxOpen(true);
  }, []);

  const close = useCallback(() => setLightboxOpen(false), []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? urls.length - 1 : i - 1));
  }, [urls.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= urls.length - 1 ? 0 : i + 1));
  }, [urls.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, close, goPrev, goNext]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="mb-6 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {t("parcelPhotos")}
        </span>
        <div
          className={
            urls.length === 1
              ? "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"
              : urls.length === 2
                ? "grid grid-cols-2 gap-2 sm:gap-3"
                : "grid grid-cols-3 gap-2 sm:gap-3"
          }
        >
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => openAt(i)}
              className={`group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-start outline-none ring-[var(--brand)] focus-visible:ring-2 ${
                urls.length === 1 ? "w-full" : "aspect-[4/3]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={`w-full object-cover transition-opacity group-hover:opacity-95 ${
                  urls.length === 1
                    ? "max-h-[min(24rem,50vh)] object-contain"
                    : "h-full min-h-[5rem]"
                }`}
              />
              {urls.length > 1 ? (
                <span className="pointer-events-none absolute bottom-2 start-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {t("photoCounter", { current: i + 1, total: urls.length })}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 sm:p-6"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            className="flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1 text-center">
                <h2
                  id={labelId}
                  className="truncate text-base font-semibold text-[var(--text-primary)] sm:text-lg"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                aria-label={t("closeGallery")}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col bg-slate-100">
              <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current}
                  alt=""
                  className="max-h-[min(60vh,520px)] w-full max-w-full object-contain"
                />

                {urls.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute bottom-4 start-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/85 text-white shadow-md transition-opacity hover:opacity-90 sm:bottom-6 sm:start-6"
                      aria-label={t("previousPhoto")}
                    >
                      <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute bottom-4 end-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/85 text-white shadow-md transition-opacity hover:opacity-90 sm:bottom-6 sm:end-6"
                      aria-label={t("nextPhoto")}
                    >
                      <ChevronRight className="h-6 w-6" strokeWidth={2} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-800/90 px-3 py-1.5 text-sm font-medium text-white sm:bottom-6">
                      <Camera className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      <span>
                        {t("photoCounter", {
                          current: safeIndex + 1,
                          total: urls.length,
                        })}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
