"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeocodeResult = {
  place_id: number;
  lat: number;
  lon: number;
  /** Full OSM string (long). */
  display_name: string;
  /** Short city-focused label from API (preferred for UI). */
  label?: string;
};

type Props = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (label: string) => void;
  onSelect: (result: GeocodeResult) => void;
  lang: string;
  required?: boolean;
};

export function NominatimAutocomplete({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  lang,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/nominatim/search?q=${encodeURIComponent(q)}&lang=${lang}`,
          { signal: AbortSignal.timeout(12_000) },
        );
        const data = (await res.json()) as { results?: GeocodeResult[] };
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [lang],
  );

  useEffect(() => {
    const t = window.setTimeout(() => void fetchResults(value.trim()), 350);
    return () => window.clearTimeout(t);
  }, [value, fetchResults]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          required={required}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
        />
        {loading ? (
          <div className="absolute end-3 top-1/2 -translate-y-1/2">
          <span
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]"
            aria-hidden
          />
          </div>
        ) : null}
      </div>
      {open && results.length > 0 ? (
        <ul
          className="absolute z-40 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {results.map((r) => {
            const line = r.label ?? r.display_name;
            return (
              <li key={r.place_id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full px-4 py-2.5 text-start text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                  onClick={() => {
                    onSelect(r);
                    setOpen(false);
                  }}
                >
                  {line}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
