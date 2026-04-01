"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { submitShipment } from "@/lib/actions/post-shipment";
import { SubmitShipmentButton } from "@/app/[locale]/post/submit-shipment-button";
import {
  NominatimAutocomplete,
  type GeocodeResult,
} from "@/components/post/NominatimAutocomplete";
import { ShipmentDateRangeFields } from "@/components/post/ShipmentDateRangeFields";

const MAX_PARCEL_PHOTOS = 3;
/** Aligné sur `post-shipment.ts` (Vercel ~4,5 Mo / 3). */
const MAX_PARCEL_PHOTO_BYTES = Math.floor((4.5 * 1024 * 1024) / 3);
const ALLOWED_PARCEL_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PostShipmentRoutingMap = dynamic(
  () => import("@/components/post/PostShipmentRoutingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[240px] w-full animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] sm:min-h-[280px] lg:min-h-[420px]" />
    ),
  },
);

type Props = {
  locale: string;
  serverError: string | null;
};

/** Chiffres + un seul séparateur décimal (`,` ou `.`). Le reste est ignoré. */
function sanitizeDecimalInput(raw: string): string {
  const s = raw.replace(/[^\d.,]/g, "");
  let i = 0;
  let intPart = "";
  while (i < s.length && /\d/.test(s[i]!)) {
    intPart += s[i]!;
    i++;
  }
  if (i < s.length && (s[i] === "," || s[i] === ".")) {
    i++;
    let frac = "";
    while (i < s.length && /\d/.test(s[i]!)) {
      frac += s[i]!;
      i++;
    }
    return frac.length > 0 ? `${intPart},${frac}` : intPart === "" ? "," : `${intPart},`;
  }
  return intPart;
}

export function PostShipmentForm({ locale, serverError }: Props) {
  const t = useTranslations("postForm");
  const localeCode = useLocale();

  const [weightKg, setWeightKg] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [originLabel, setOriginLabel] = useState("");
  const [destLabel, setDestLabel] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [parcelFiles, setParcelFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDistanceKm = useCallback((km: number | null) => {
    setRouteKm(km);
  }, []);

  /** Une seule photo par choix + reset input : indispensable caméra mobile (sinon seule la dernière reste). */
  const onParcelPhotoPicked = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const file = input.files?.[0];
      input.value = "";
      setPhotoError(null);
      if (!file || file.size === 0) return;
      if (!ALLOWED_PARCEL_TYPES.has(file.type)) {
        setPhotoError(t("parcelPhotoErrorType"));
        return;
      }
      if (file.size > MAX_PARCEL_PHOTO_BYTES) {
        setPhotoError(t("parcelPhotoErrorSize"));
        return;
      }
      setParcelFiles((prev) => {
        if (prev.length >= MAX_PARCEL_PHOTOS) return prev;
        return [...prev, file];
      });
    },
    [t],
  );

  const removeParcelPhoto = useCallback((index: number) => {
    setParcelFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoError(null);
  }, []);

  const previewUrls = useMemo(
    () => parcelFiles.map((f) => URL.createObjectURL(f)),
    [parcelFiles],
  );
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewUrls]);

  const onFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      setIsSubmitting(true);
      try {
        const fd = new FormData(form);
        for (const f of parcelFiles) {
          fd.append("parcel_photos", f);
        }
        await submitShipment(fd);
      } finally {
        setIsSubmitting(false);
      }
    },
    [parcelFiles],
  );

  const onOriginSelect = (r: GeocodeResult) => {
    setOriginLabel(r.label ?? r.display_name);
    setOriginCoords([r.lat, r.lon]);
  };

  const onDestSelect = (r: GeocodeResult) => {
    setDestLabel(r.label ?? r.display_name);
    setDestCoords([r.lat, r.lon]);
  };

  const bothGeocoded = Boolean(originCoords && destCoords);

  return (
    <form
      onSubmit={onFormSubmit}
      encType="multipart/form-data"
      className="mt-8 space-y-6"
    >
      <input type="hidden" name="locale" value={locale} />

      {serverError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <NominatimAutocomplete
            id="origin"
            name="origin"
            label={t("origin")}
            placeholder={t("originPlaceholder")}
            value={originLabel}
            onChange={(v) => {
              setOriginLabel(v);
              setOriginCoords(null);
              setRouteKm(null);
            }}
            onSelect={onOriginSelect}
            lang={localeCode}
            required
          />

          <NominatimAutocomplete
            id="destination"
            name="destination"
            label={t("destination")}
            placeholder={t("destinationPlaceholder")}
            value={destLabel}
            onChange={(v) => {
              setDestLabel(v);
              setDestCoords(null);
              setRouteKm(null);
            }}
            onSelect={onDestSelect}
            lang={localeCode}
            required
          />

          {bothGeocoded ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-[var(--text-primary)]">
              {routeKm != null ? (
                <span className="font-medium">
                  {t("routeDistanceKm", { km: routeKm })}
                </span>
              ) : (
                <span className="text-[var(--text-muted)]">
                  {t("routeCalculating")}
                </span>
              )}
            </div>
          ) : null}

          <ShipmentDateRangeFields />

          <div>
            <label
              htmlFor="parcel_photos"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("parcelPhoto")}
            </label>
            <p className="mb-2 text-xs text-[var(--text-muted)]">
              {t("parcelPhotoHint")}
            </p>
            <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
              {t("parcelPhotoCameraHint")}
            </p>
            <input
              id="parcel_photos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onParcelPhotoPicked}
              disabled={parcelFiles.length >= MAX_PARCEL_PHOTOS}
              className="w-full max-w-md text-sm text-[var(--text-primary)] file:me-3 file:rounded-lg file:border-0 file:bg-[var(--surface-muted)] file:px-4 file:py-2 file:font-medium file:text-[var(--text-primary)] disabled:opacity-50"
            />
            {photoError ? (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {photoError}
              </p>
            ) : null}
            {parcelFiles.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {parcelFiles.map((file, i) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrls[i]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeParcelPhoto(i)}
                      className="absolute end-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-xs font-bold text-white hover:bg-black/80"
                      aria-label={t("removeParcelPhoto")}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {parcelFiles.length > 0 && parcelFiles.length < MAX_PARCEL_PHOTOS ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {t("parcelPhotoCount", {
                  count: parcelFiles.length,
                  max: MAX_PARCEL_PHOTOS,
                })}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="parcel_description"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("parcelDescription")}
            </label>
            <p className="mb-2 text-xs text-[var(--text-muted)]">
              {t("parcelDescriptionHint")}
            </p>
            <textarea
              id="parcel_description"
              name="parcel_description"
              rows={4}
              maxLength={2000}
              placeholder={t("parcelDescriptionPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="weight_kg"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                {t("weight")}
              </label>
              <input
                id="weight_kg"
                name="weight_kg"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(sanitizeDecimalInput(e.target.value))}
                placeholder={t("weightPlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                {t("price")}
              </label>
              <input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={priceInput}
                onChange={(e) => setPriceInput(sanitizeDecimalInput(e.target.value))}
                placeholder={t("pricePlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
              />
            </div>
          </div>

          <SubmitShipmentButton
            label={t("submit")}
            pendingLabel={t("submitting")}
            pending={isSubmitting}
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] lg:sr-only">
            {t("mapSectionLabel")}
          </p>
          <PostShipmentRoutingMap
            origin={originCoords}
            destination={destCoords}
            onDistanceKm={onDistanceKm}
            emptyLabel={t("mapPlaceholder")}
          />
        </div>
      </div>
    </form>
  );
}
