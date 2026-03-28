"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { submitShipment } from "@/lib/actions/post-shipment";
import { SubmitShipmentButton } from "@/app/[locale]/post/submit-shipment-button";
import {
  NominatimAutocomplete,
  type GeocodeResult,
} from "@/components/post/NominatimAutocomplete";

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

export function PostShipmentForm({ locale, serverError }: Props) {
  const t = useTranslations("postForm");
  const localeCode = useLocale();

  const [originLabel, setOriginLabel] = useState("");
  const [destLabel, setDestLabel] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);

  const onDistanceKm = useCallback((km: number | null) => {
    setRouteKm(km);
  }, []);

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
      action={submitShipment}
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

          <div>
            <label
              htmlFor="parcel_photo"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("parcelPhoto")}
            </label>
            <p className="mb-2 text-xs text-[var(--text-muted)]">
              {t("parcelPhotoHint")}
            </p>
            <input
              id="parcel_photo"
              name="parcel_photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full max-w-md text-sm text-[var(--text-primary)] file:me-3 file:rounded-lg file:border-0 file:bg-[var(--surface-muted)] file:px-4 file:py-2 file:font-medium file:text-[var(--text-primary)]"
            />
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
                required
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
                required
                placeholder={t("pricePlaceholder")}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
              />
            </div>
          </div>

          <SubmitShipmentButton
            label={t("submit")}
            pendingLabel={t("submitting")}
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
