"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { acceptOffer, refuseOffer } from "@/lib/actions/offers";
import type { OfferRow, Profile } from "@/lib/auth";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

type Props = {
  offers: OfferRow[];
  profileMap: Record<string, Profile>;
  shipmentId: string;
  isOwner: boolean;
  locale: string;
};

export function OffersList({ offers, profileMap, shipmentId, isOwner, locale }: Props) {
  const t = useTranslations("offers");
  const currentLocale = useLocale();

  if (offers.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">{t("noOffers")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const tp = profileMap[offer.transporteur_id];
        const statusColor =
          offer.status === "accepted"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : offer.status === "refused"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200";

        return (
          <div
            key={offer.id}
            className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {tp ? (
                  <Link
                    href={`/profile/${tp.id}`}
                    className="font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] hover:underline"
                  >
                    {tp.first_name} {tp.last_name}
                  </Link>
                ) : (
                  <span className="font-semibold text-[var(--text-primary)]">{t("unknownUser")}</span>
                )}
                {tp && <Stars rating={tp.avg_rating} />}
              </div>
              {tp && (
                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                  <span>{t("points")}: {tp.points}</span>
                  <span>{t("transactions")}: {tp.total_transactions}</span>
                  {tp.transport_type && <span>{tp.transport_type}</span>}
                </div>
              )}
              <p className="text-lg font-bold text-[var(--brand)]">
                {Number(offer.price).toLocaleString(
                  currentLocale === "ar" ? "ar-MA" : "fr-FR",
                  { style: "currency", currency: "MAD", maximumFractionDigits: 0 },
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}>
                {t(`status_${offer.status}`)}
              </span>

              {isOwner && offer.status === "pending" && (
                <>
                  <form action={acceptOffer}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="offer_id" value={offer.id} />
                    <input type="hidden" name="shipment_id" value={shipmentId} />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      {t("accept")}
                    </button>
                  </form>
                  <form action={refuseOffer}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="offer_id" value={offer.id} />
                    <input type="hidden" name="shipment_id" value={shipmentId} />
                    <button
                      type="submit"
                      className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                      {t("refuse")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
