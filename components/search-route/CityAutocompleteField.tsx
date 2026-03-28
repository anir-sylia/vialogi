"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** Classes additionnelles sur le champ (coins, etc.) */
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
  inputClassName = "",
}: Props) {
  const locale = useLocale();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
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
  }

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id} className="sr-only">
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
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full border-0 bg-transparent py-3.5 ps-11 pe-10 text-base text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:ring-0 ${inputClassName}`}
        aria-autocomplete="list"
        aria-expanded={open && places.length > 0}
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

      {open && places.length > 0 ? (
        <ul
          id={`${id}-listbox`}
          className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {places.map((p) => (
            <li key={p.id} role="option">
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-start text-sm transition-colors hover:bg-[var(--surface-muted)]"
                onClick={() => pickPlace(p)}
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
  );
}
