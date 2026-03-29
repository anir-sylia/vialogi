"use client";

import { useLocale } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type ResolvedPlace = {
  display: string;
  lat: number;
  lng: number;
};

type PlaceRow = {
  id: string;
  name: string;
  country: string;
  state: string;
  lat: number | null;
  lng: number | null;
};

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

type Props = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onResolvedPlace?: (place: ResolvedPlace | null) => void;
  placeholder: string;
  label: string;
  /** When true, show the label above the field; otherwise it is screen-reader only. */
  labelVisible?: boolean;
  inputClassName?: string;
};

export function CityAutocompleteField({
  id,
  name,
  value,
  onChange,
  onResolvedPlace,
  placeholder,
  label,
  labelVisible = false,
  inputClassName = "",
}: Props) {
  const locale = useLocale();
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updateMenuPosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuPos({
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  }, []);

  const fetchPlaces = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setPlaces([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(q)}&lang=${locale}&country=ma`,
          { signal: AbortSignal.timeout(12_000) },
        );
        const data = (await res.json()) as { places?: PlaceRow[] };
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
    const timer = window.setTimeout(() => {
      void fetchPlaces(value.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [value, fetchPlaces]);

  useLayoutEffect(() => {
    if (open && places.length > 0) {
      updateMenuPosition();
    } else {
      setMenuPos(null);
    }
  }, [open, places.length, updateMenuPosition, value]);

  useEffect(() => {
    if (!open || places.length === 0) return;
    function onScrollOrResize() {
      updateMenuPosition();
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, places.length, updateMenuPosition]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function pickPlace(p: PlaceRow) {
    const display = [p.name, p.state, p.country].filter(Boolean).join(", ");
    onChange(display);
    if (p.lat != null && p.lng != null) {
      onResolvedPlace?.({ display, lat: p.lat, lng: p.lng });
    } else {
      onResolvedPlace?.(null);
    }
    setOpen(false);
    setMenuPos(null);
  }

  const showList = open && places.length > 0 && menuPos !== null;
  const mounted =
    typeof document !== "undefined" && document.body !== null;

  const listEl = showList && mounted ? (
    <ul
      ref={listRef}
      id={`${id}-listbox`}
      style={{
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        zIndex: 9999,
        maxHeight: "min(50vh, 16rem)",
      }}
      className="overflow-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-xl"
      role="listbox"
    >
      {places.map((p) => (
        <li key={p.id} role="option">
          <button
            type="button"
            className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-start text-sm transition-colors hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]"
            onMouseDown={(e) => {
              e.preventDefault();
              pickPlace(p);
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
  ) : null;

  return (
    <div ref={wrapRef} className="relative">
      <label
        htmlFor={id}
        className={
          labelVisible
            ? "mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            : "sr-only"
        }
      >
        {label}
      </label>
      <span className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-[var(--brand)]">
        <PinIcon className="h-5 w-5" />
      </span>
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onResolvedPlace?.(null);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          queueMicrotask(() => updateMenuPosition());
        }}
        placeholder={placeholder}
        className={`w-full border-0 bg-transparent py-3.5 ps-11 pe-10 text-base text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:ring-0 ${inputClassName}`}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={`${id}-listbox`}
      />
      {loading ? (
        <div className="absolute end-3 top-1/2 -translate-y-1/2">
          <span
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]"
            aria-hidden
          />
        </div>
      ) : null}

      {mounted && listEl ? createPortal(listEl, document.body) : null}
    </div>
  );
}
