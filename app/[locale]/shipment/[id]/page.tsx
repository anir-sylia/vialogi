import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import { getShipmentForViewer } from "@/lib/shipments";
import {
  getProfile,
  getOffersForShipment,
  getReviewsForUser,
  userHasReviewedShipment,
} from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { OfferForm } from "@/components/shipment/OfferForm";
import { OffersList } from "@/components/shipment/OffersList";
import { ReviewForm } from "@/components/shipment/ReviewForm";
import { ReviewsList } from "@/components/shipment/ReviewsList";
import { ShipmentModerationActions } from "@/components/shipment/ShipmentModerationActions";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function ShipmentDetailPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shipment = await getShipmentForViewer(id, user?.id ?? null);
  if (!shipment) notFound();

  if (!user) {
    return redirect({
      href: { pathname: "/signup", query: { next: `/shipment/${id}` } },
      locale,
    });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return redirect({
      href: { pathname: "/signup", query: { next: `/shipment/${id}` } },
      locale,
    });
  }

  const t = await getTranslations("shipmentDetail");
  const to = await getTranslations("offers");
  const tr = await getTranslations("reviews");

  let ownerProfile: Profile | null = null;
  if (shipment.user_id) {
    ownerProfile = await getProfile(shipment.user_id);
  }

  const isOwner = profile.id === shipment.user_id;
  const isTransporteur = profile.role === "transporteur";
  const isAdmin = profile.role === "admin";
  const canRemoveShipment = isOwner || isAdmin;
  const canChat = isOwner || isTransporteur;

  const offers = await getOffersForShipment(id);

  const [reviewsAboutOwner, reviewsAboutTransporteur, hasReviewed] =
    await Promise.all([
      shipment.user_id ? getReviewsForUser(shipment.user_id) : Promise.resolve([]),
      shipment.assigned_transporteur_id
        ? getReviewsForUser(shipment.assigned_transporteur_id)
        : Promise.resolve([]),
      userHasReviewedShipment(id, user.id),
    ]);

  const profileIds = new Set<string>();
  offers.forEach((o) => profileIds.add(o.transporteur_id));
  for (const r of reviewsAboutOwner) {
    profileIds.add(r.from_user_id);
    profileIds.add(r.to_user_id);
  }
  for (const r of reviewsAboutTransporteur) {
    profileIds.add(r.from_user_id);
    profileIds.add(r.to_user_id);
  }
  if (shipment.user_id) profileIds.add(shipment.user_id);
  if (shipment.assigned_transporteur_id) profileIds.add(shipment.assigned_transporteur_id);

  const profileMap: Record<string, Profile> = {};
  for (const pid of profileIds) {
    const p = await getProfile(pid);
    if (p) profileMap[pid] = p;
  }

  const phone = ownerProfile?.phone;
  const whatsappUrl = phone
    ? `https://wa.me/${phone.replace(/[\s\-\(\)]/g, "")}?text=${encodeURIComponent(
        `${t("whatsappMessage")} : ${shipment.origin} → ${shipment.destination}`,
      )}`
    : null;

  const isAssigned = shipment.status === "assigned" || shipment.status === "completed";

  const showOwnerReviewBlock =
    Boolean(shipment.user_id) &&
    !(shipment.user_id === shipment.assigned_transporteur_id);
  const showTransporteurReviewBlock =
    Boolean(shipment.assigned_transporteur_id) &&
    shipment.assigned_transporteur_id !== shipment.user_id;
  const showSinglePartyReviews =
    Boolean(shipment.user_id) &&
    shipment.user_id === shipment.assigned_transporteur_id;

  let reviewTarget: { id: string; name: string } | null = null;
  if (isAssigned && !hasReviewed) {
    if (isOwner && shipment.assigned_transporteur_id) {
      const tp = profileMap[shipment.assigned_transporteur_id];
      if (tp) reviewTarget = { id: tp.id, name: `${tp.first_name} ${tp.last_name}` };
    } else if (isTransporteur && shipment.user_id) {
      const cl = profileMap[shipment.user_id];
      if (cl) reviewTarget = { id: cl.id, name: `${cl.first_name} ${cl.last_name}` };
    }
  }
  if (reviewTarget && reviewTarget.id === user.id) {
    reviewTarget = null;
  }

  const statusColor =
    shipment.status === "assigned"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : shipment.status === "completed"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  const successMsg = typeof sp.success === "string" ? sp.success : null;
  const errorMsg = typeof sp.error === "string" ? sp.error : null;

  const successBanner =
    successMsg === "review_sent"
      ? tr("success_review_sent")
      : successMsg
        ? to(`success_${successMsg}` as Parameters<typeof to>[0])
        : null;

  const reviewErrorCodes = new Set([
    "invalid_review",
    "already_reviewed",
    "review_failed",
    "cannot_review_self",
  ]);
  const errorBanner =
    errorMsg && reviewErrorCodes.has(errorMsg)
      ? tr(`error_${errorMsg}` as Parameters<typeof tr>[0])
      : errorMsg
        ? to(`error_${errorMsg}` as Parameters<typeof to>[0])
        : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("back")}
      </Link>

      {successBanner ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successBanner}
        </div>
      ) : null}
      {errorBanner ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {errorBanner}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
        {shipment.parcel_photo_url ? (
          <div className="mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shipment.parcel_photo_url}
              alt={t("parcelPhoto")}
              className="max-h-[min(24rem,50vh)] w-full object-contain"
            />
          </div>
        ) : null}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t("route")}
            </span>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {shipment.origin}
              <span className="mx-2 text-[var(--text-muted)]">→</span>
              {shipment.destination}
            </h1>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}>
            {t(`status_${shipment.status}`)}
          </span>
        </div>

        {shipment.parcel_description?.trim() ? (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t("parcelDescription")}
            </span>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {shipment.parcel_description.trim()}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("weight")}
            </span>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {Number(shipment.weight_kg).toLocaleString(
                locale === "ar" ? "ar-MA" : "fr-FR",
              )}{" "}
              kg
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("price")}
            </span>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {Number(shipment.price).toLocaleString(
                locale === "ar" ? "ar-MA" : "fr-FR",
                { style: "currency", currency: "MAD", maximumFractionDigits: 0 },
              )}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("publishedAt")}
            </span>
            <p className="mt-1 text-sm text-[var(--text-primary)]">
              {formatDate(shipment.created_at, locale)}
            </p>
          </div>
          {ownerProfile ? (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {t("publishedBy")}
              </span>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                <Link
                  href={`/profile/${ownerProfile.id}`}
                  className="hover:text-[var(--brand)] hover:underline"
                >
                  {ownerProfile.first_name} {ownerProfile.last_name}
                </Link>
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
          {canChat ? (
            <Link
              href={`/chat/${shipment.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {t("openChat")}
            </Link>
          ) : (
            <p className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-6 py-3.5 text-center text-sm text-[var(--text-muted)]">
              {t("chatOnlyTransporteur")}
            </p>
          )}

          {whatsappUrl && isTransporteur ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          ) : null}
        </div>

        <ShipmentModerationActions
          shipmentId={id}
          canRemove={canRemoveShipment}
          isAdmin={isAdmin}
        />
      </div>

      {/* Offers Section */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
          {to("heading")}
          {offers.length > 0 && (
            <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[var(--brand)] px-2 text-xs font-bold text-white">
              {offers.length}
            </span>
          )}
        </h2>

        {isTransporteur && shipment.status === "open" && (
          <div className="mb-6 rounded-xl border border-dashed border-[var(--brand)]/30 bg-[var(--brand)]/5 p-4">
            <OfferForm shipmentId={id} locale={locale} />
          </div>
        )}

        <OffersList
          offers={offers}
          profileMap={profileMap}
          shipmentId={id}
          isOwner={isOwner}
          locale={locale}
        />
      </div>

      {/* Reviews Section — mêmes listes que sur le profil (pas seulement cet envoi) */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{tr("heading")}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{tr("globalReviewsHint")}</p>

        {reviewTarget && (
          <div className="mt-6 rounded-xl border border-dashed border-amber-300/50 bg-amber-50/50 p-4">
            <ReviewForm
              shipmentId={id}
              toUserId={reviewTarget.id}
              toUserName={reviewTarget.name}
              locale={locale}
            />
          </div>
        )}

        {showSinglePartyReviews && ownerProfile ? (
          <>
            <h3 className="mt-6 text-base font-semibold text-[var(--text-primary)]">
              {tr("reviewsReceivedBy", {
                name: `${ownerProfile.first_name} ${ownerProfile.last_name}`,
              })}
            </h3>
            <div className="mt-3">
              <ReviewsList reviews={reviewsAboutOwner} profileMap={profileMap} />
            </div>
          </>
        ) : (
          <>
            {showOwnerReviewBlock && ownerProfile ? (
              <>
                <h3 className="mt-6 text-base font-semibold text-[var(--text-primary)]">
                  {tr("reviewsReceivedBy", {
                    name: `${ownerProfile.first_name} ${ownerProfile.last_name}`,
                  })}
                </h3>
                <div className="mt-3">
                  <ReviewsList reviews={reviewsAboutOwner} profileMap={profileMap} />
                </div>
              </>
            ) : null}
            {showTransporteurReviewBlock && shipment.assigned_transporteur_id ? (
              <>
                <h3
                  className={`mt-6 text-base font-semibold text-[var(--text-primary)] ${showOwnerReviewBlock ? "border-t border-[var(--border)] pt-6" : ""}`}
                >
                  {tr("reviewsReceivedBy", {
                    name: (() => {
                      const tp = profileMap[shipment.assigned_transporteur_id!];
                      return tp
                        ? `${tp.first_name} ${tp.last_name}`
                        : tr("unknownUser");
                    })(),
                  })}
                </h3>
                <div className="mt-3">
                  <ReviewsList
                    reviews={reviewsAboutTransporteur}
                    profileMap={profileMap}
                  />
                </div>
              </>
            ) : null}
          </>
        )}

        {!showOwnerReviewBlock &&
        !showTransporteurReviewBlock &&
        !showSinglePartyReviews ? (
          <div className="mt-6">
            <ReviewsList reviews={[]} profileMap={profileMap} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
