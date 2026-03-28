"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type Place = {
  id: string;
  name: string;
  country: string;
  state: string;
  lat: number;
  lng: number;
};

type RouteResult = {
  distanceKm: number;
  durationMin: number | null;
  positions: [number, number][];
  mode: "road" | "straight";
};

const RouteMap = dynamic(() => import("@/components/RouteMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[280px] w-full animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
  ),
});

function CityAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  places,
  open,
  onOpenChange,
  loading,
  placeholder,
  wrapRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: Place) => void;
  places: Place[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  loading: boolean;
  placeholder: string;
  wrapRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative" ref={wrapRef}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
      </label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onOpenChange(true);
        }}
        onFocus={() => onOpenChange(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
      />
      {loading ? (
        <div className="absolute end-3 top-9 -translate-y-1/2">
          <span
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]"
            aria-hidden
          />
        </div>
      ) : null}
      {open && places.length > 0 ? (
        <ul
          className="absolute z-30 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {places.map((p) => (
            <li key={p.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-start text-sm transition-colors hover:bg-[var(--surface-muted)]"
                onClick={() => {
                  onSelect(p);
                  onOpenChange(false);
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
  );
}

export function MoroccoRoutePlanner() {
  const t = useTranslations("routePlanner");
  const locale = useLocale();

  const [originQ, setOriginQ] = useState("");
  const [destQ, setDestQ] = useState("");
  const [originPlaces, setOriginPlaces] = useState<Place[]>([]);
  const [destPlaces, setDestPlaces] = useState<Place[]>([]);
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);
  const [origin, setOrigin] = useState<Place | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const wrapO = useRef<HTMLDivElement>(null);
  const wrapD = useRef<HTMLDivElement>(null);

  const fetchMa = useCallback(
    async (q: string, which: "origin" | "dest") => {
      if (q.length < 2) {
        if (which === "origin") {
          setOriginPlaces([]);
          setOriginLoading(false);
        } else {
          setDestPlaces([]);
          setDestLoading(false);
        }
        return;
      }
      const setLoading = which === "origin" ? setOriginLoading : setDestLoading;
      const setPl = which === "origin" ? setOriginPlaces : setDestPlaces;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(q)}&lang=${locale}&country=ma`,
          { signal: AbortSignal.timeout(12_000) },
        );
        const data = (await res.json()) as { places?: Place[] };
        const list = (data.places ?? []).filter(
          (p): p is Place =>
            typeof p.lat === "number" && typeof p.lng === "number",
        );
        setPl(list);
      } catch {
        setPl([]);
      } finally {
        setLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    const id = window.setTimeout(() => void fetchMa(originQ.trim(), "origin"), 280);
    return () => window.clearTimeout(id);
  }, [originQ, fetchMa]);

  useEffect(() => {
    const id = window.setTimeout(() => void fetchMa(destQ.trim(), "dest"), 280);
    return () => window.clearTimeout(id);
  }, [destQ, fetchMa]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const node = e.target as Node;
      if (!wrapO.current?.contains(node)) setOriginOpen(false);
      if (!wrapD.current?.contains(node)) setDestOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    if (!origin || !dest) {
      setRoute(null);
      return;
    }
    const ctrl = new AbortController();
    setRouteLoading(true);
    void (async () => {
      try {
        const u = new URL("/api/route", window.location.origin);
        u.searchParams.set("lat1", String(origin.lat));
        u.searchParams.set("lon1", String(origin.lng));
        u.searchParams.set("lat2", String(dest.lat));
        u.searchParams.set("lon2", String(dest.lng));
        const res = await fetch(u.toString(), { signal: ctrl.signal });
        const data = (await res.json()) as RouteResult;
        if (!ctrl.signal.aborted && data.positions?.length >= 2) {
          setRoute(data);
        }
      } catch {
        if (!ctrl.signal.aborted) setRoute(null);
      } finally {
        if (!ctrl.signal.aborted) setRouteLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [origin, dest]);

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"
      aria-labelledby="route-planner-heading"
    >
      <div className="mb-8 text-center">
        <h2
          id="route-planner-heading"
          className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl"
        >
          {t("title")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-[var(--text-muted)]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <CityAutocomplete
            id="ma-origin"
            label={t("origin")}
            value={originQ}
            onChange={(v) => {
              setOriginQ(v);
              setOrigin(null);
            }}
            onSelect={(p) => {
              setOrigin(p);
              setOriginQ(p.name);
            }}
            places={originPlaces}
            open={originOpen}
            onOpenChange={setOriginOpen}
            loading={originLoading}
            placeholder={t("originPlaceholder")}
            wrapRef={wrapO}
          />
          <CityAutocomplete
            id="ma-dest"
            label={t("destination")}
            value={destQ}
            onChange={(v) => {
              setDestQ(v);
              setDest(null);
            }}
            onSelect={(p) => {
              setDest(p);
              setDestQ(p.name);
            }}
            places={destPlaces}
            open={destOpen}
            onOpenChange={setDestOpen}
            loading={destLoading}
            placeholder={t("destinationPlaceholder")}
            wrapRef={wrapD}
          />

          {origin && dest ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
              {routeLoading ? (
                <p className="text-[var(--text-muted)]">{t("calculating")}</p>
              ) : route ? (
                <div className="space-y-1">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {t("distance", { km: route.distanceKm })}
                  </p>
                  {route.durationMin != null ? (
                    <p className="text-[var(--text-muted)]">
                      {t("duration", { min: route.durationMin })}
                    </p>
                  ) : null}
                  <p className="text-xs text-[var(--text-muted)]">
                    {route.mode === "road" ? t("modeRoad") : t("modeStraight")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{t("pickTwo")}</p>
          )}
        </div>

        <div className="h-[min(420px,55vh)] min-h-[280px] overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
          {route && !routeLoading ? (
            <RouteMap positions={route.positions} className="h-full w-full" />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
              {routeLoading ? t("calculating") : t("mapEmpty")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
