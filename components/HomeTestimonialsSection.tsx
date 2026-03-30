"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";

type TestimonialItem = {
  name: string;
  quote: string;
};

function StarRow() {
  return (
    <div
      className="flex shrink-0 gap-0.5"
      aria-hidden
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-amber-400 text-amber-400"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function HomeTestimonialsSection() {
  const t = useTranslations("homeTestimonials");
  const items = t.raw("items") as TestimonialItem[];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [index, setIndex] = useState(0);

  const clampedIndex = Math.min(Math.max(0, index), Math.max(0, items.length - 1));

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;

    const syncIndex = () => {
      const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cardRefs.current.forEach((c, i) => {
        if (!c) return;
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const d = Math.abs(cx - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setIndex(best);
    };

    el.addEventListener("scroll", syncIndex, { passive: true });
    syncIndex();
    return () => el.removeEventListener("scroll", syncIndex);
  }, [items.length]);

  const scrollTo = useCallback((i: number) => {
    const next = Math.min(Math.max(0, i), items.length - 1);
    setIndex(next);
    cardRefs.current[next]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [items.length]);

  const canPrev = clampedIndex > 0;
  const canNext = clampedIndex < items.length - 1;

  return (
    <section
      className="bg-slate-50 py-20 sm:py-24 md:py-28"
      aria-labelledby="home-testimonials-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="home-testimonials-heading"
          className="text-center text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl"
        >
          {t("title")}
        </h2>

        <div className="relative mt-12 md:mt-14">
          <button
            type="button"
            aria-label={t("prevAria")}
            disabled={!canPrev}
            onClick={() => scrollTo(clampedIndex - 1)}
            className="absolute start-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-slate-900 p-3 text-white shadow-md transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 md:flex md:items-center md:justify-center"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t("nextAria")}
            disabled={!canNext}
            onClick={() => scrollTo(clampedIndex + 1)}
            className="absolute end-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-slate-900 p-3 text-white shadow-md transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 md:flex md:items-center md:justify-center"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div
            className="md:px-12"
            role="region"
            aria-roledescription="carousel"
            aria-label={t("title")}
          >
            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ paddingInline: "clamp(0rem, 2vw, 0.5rem)" }}
            >
              {items.map((item, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  data-testimonial-index={i}
                  className="w-[min(100%,22rem)] shrink-0 snap-center sm:w-[min(100%,24rem)]"
                >
                  <article
                    className="flex h-full min-h-[12rem] flex-col rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-bold text-[var(--text-primary)]">
                        {item.name}
                      </p>
                      <StarRow />
                    </div>
                    <p className="mt-4 max-w-none text-pretty text-sm leading-relaxed text-slate-600">
                      {item.quote}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
