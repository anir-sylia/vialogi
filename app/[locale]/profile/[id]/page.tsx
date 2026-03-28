import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getProfile, getReviewsForUser } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { ReviewsList } from "@/components/shipment/ReviewsList";
import { ProfilePhotoForms } from "@/components/profile/ProfilePhotoForms";
import { createSupabaseServerClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${cls} ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const targetProfile = await getProfile(id);
  if (!targetProfile) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = Boolean(user && user.id === id);

  const t = await getTranslations("profile");
  const reviews = await getReviewsForUser(id);

  const profileMap: Record<string, Profile> = {};
  profileMap[id] = targetProfile;
  const reviewerIds = new Set(reviews.map((r) => r.from_user_id));
  for (const rid of reviewerIds) {
    if (!profileMap[rid]) {
      const p = await getProfile(rid);
      if (p) profileMap[rid] = p;
    }
  }

  const roleBadge =
    targetProfile.role === "client"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : targetProfile.role === "admin"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const errRaw = typeof sp.e === "string" ? sp.e : null;
  const photoError =
    errRaw === "invalid_photo" || errRaw === "forbidden" || errRaw === "db"
      ? t(`photoError_${errRaw}` as Parameters<typeof t>[0])
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("backHome")}
      </Link>

      {photoError ? (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {photoError}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {targetProfile.avatar_url ? (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={targetProfile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-2xl font-bold text-[var(--brand)]">
              {targetProfile.first_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {targetProfile.first_name} {targetProfile.last_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${roleBadge}`}>
                {t(`role_${targetProfile.role}`)}
              </span>
              {targetProfile.transport_type && (
                <span className="text-xs text-[var(--text-muted)]">{targetProfile.transport_type}</span>
              )}
            </div>
          </div>
        </div>

        {targetProfile.role === "transporteur" && targetProfile.transport_photo_url ? (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("transportPhotoLabel")}
            </p>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={targetProfile.transport_photo_url}
                alt={t("transportPhotoAlt")}
                className="max-h-64 w-full object-cover"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-[var(--surface-muted)] p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--brand)]">{targetProfile.points}</p>
            <p className="text-xs text-[var(--text-muted)]">{t("points")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{targetProfile.total_transactions}</p>
            <p className="text-xs text-[var(--text-muted)]">{t("transactions")}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Stars rating={targetProfile.avg_rating} size="sm" />
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {targetProfile.avg_rating > 0 ? targetProfile.avg_rating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t("avgRating")}</p>
          </div>
        </div>

        {targetProfile.phone && (
          <div className="mt-4 text-sm text-[var(--text-muted)]">
            <span className="font-medium">{t("phone")}:</span> {targetProfile.phone}
          </div>
        )}

        {isOwnProfile && (targetProfile.role === "client" || targetProfile.role === "transporteur") ? (
          <ProfilePhotoForms
            profileId={id}
            locale={locale}
            isTransporteur={targetProfile.role === "transporteur"}
          />
        ) : null}

        {isOwnProfile && (targetProfile.role === "client" || targetProfile.role === "transporteur") ? (
          <div className="mt-6 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-4 sm:p-5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{t("messagesCta")}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{t("messagesHint")}</p>
            <Link
              href="/messages"
              className="mt-3 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {t("messagesCta")} →
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
          {t("reviewsHeading")}
          {reviews.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({reviews.length})</span>
          )}
        </h2>
        <ReviewsList reviews={reviews} profileMap={profileMap} />
      </div>
    </div>
  );
}
