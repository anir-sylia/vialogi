import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  listShipments,
  listShipmentsForAuthenticatedOwner,
  type ShipmentRow,
} from "@/lib/shipments";
import { getOfferCountsForShipments } from "@/lib/auth";

type Props = {
  locale: string;
  searchQuery?: string | undefined;
  mode?: "public" | "mine";
};

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabelKey(
  status: ShipmentRow["status"],
):
  | "status_open"
  | "status_assigned"
  | "status_completed"
  | "status_removed" {
  switch (status) {
    case "assigned":
      return "status_assigned";
    case "completed":
      return "status_completed";
    case "removed":
      return "status_removed";
    default:
      return "status_open";
  }
}

export async function ShipmentsSection({
  locale,
  searchQuery,
  mode = "public",
}: Props) {
  const t = await getTranslations("shipments");
  const tDetail = await getTranslations("shipmentDetail");
  const shipments =
    mode === "mine"
      ? await listShipmentsForAuthenticatedOwner()
      : await listShipments(searchQuery);
  const offerCounts = await getOfferCountsForShipments(shipments.map((s) => s.id));

  const heading = mode === "mine" ? t("myHeading") : t("heading");
  const subheading = mode === "mine" ? t("mySubheading") : t("subheading");

  return (
    <section
      id={mode === "mine" ? "my-shipments" : "loads"}
      className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {heading}
          </h2>
          <p className="mt-1 text-[var(--text-muted)]">{subheading}</p>
        </div>
        {mode === "public" && searchQuery?.trim() ? (
          <div className="text-end text-sm">
            <p className="font-medium text-[var(--brand)]">
              {t("filteredBy", { q: searchQuery.trim() })}
            </p>
            <p className="mt-0.5 text-[var(--text-muted)]">
              {t("matchCount", { count: shipments.length })}
            </p>
          </div>
        ) : null}
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-6 py-16 text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            {mode === "mine"
              ? t("myEmpty")
              : searchQuery?.trim()
                ? t("emptyFiltered")
                : t("empty")}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {mode === "mine" ? t("myEmptyHint") : t("emptyHint")}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shipments.map((s: ShipmentRow) => {
            const count = offerCounts[s.id] ?? 0;
            return (
              <li key={s.id}>
                <article className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
                    {s.parcel_photo_url ? (
                      <>
                        {/* Supabase Storage URL — pas de domaine fixe pour next/image en OSS */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.parcel_photo_url}
                          alt={t("parcelPhotoAlt")}
                          className="aspect-[4/3] w-full object-cover"
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <div
                        className="aspect-[4/3] w-full bg-[var(--surface-muted)]"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        {mode === "mine" ? (
                          <span className="mb-0.5 w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {tDetail(statusLabelKey(s.status))}
                          </span>
                        ) : null}
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          {t("cardRoute")}
                        </span>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {s.origin}
                          </span>
                          <span className="text-[var(--text-muted)]" aria-hidden>
                            →
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {s.destination}
                          </span>
                        </div>
                      </div>
                      {count > 0 && (
                        <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-[var(--brand)] px-2 text-xs font-bold text-white" title={t("offersCount", { count })}>
                          {count}
                        </span>
                      )}
                    </div>
                    {s.parcel_description?.trim() ? (
                      <p className="line-clamp-3 text-sm text-[var(--text-primary)]">
                        <span className="font-medium text-[var(--text-muted)]">
                          {t("parcelDescription")}:{" "}
                        </span>
                        {s.parcel_description.trim()}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-muted)]">
                      <span>
                        {t("weight")}:{" "}
                        <span className="font-medium text-[var(--text-primary)]">
                          {Number(s.weight_kg).toLocaleString(
                            locale === "ar" ? "ar-MA" : "fr-FR",
                          )}{" "}
                          kg
                        </span>
                      </span>
                      <span>
                        {t("price")}:{" "}
                        <span className="font-medium text-[var(--text-primary)]">
                          {Number(s.price).toLocaleString(
                            locale === "ar" ? "ar-MA" : "fr-FR",
                            {
                              style: "currency",
                              currency: "MAD",
                              maximumFractionDigits: 0,
                            },
                          )}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatDate(s.created_at, locale)}
                    </p>
                  </div>
                  <div className="mt-4 shrink-0 border-t border-[var(--border)] pt-4">
                    <Link
                      href={`/shipment/${s.id}`}
                      className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      {t("viewDetails")}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
