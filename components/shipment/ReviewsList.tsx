"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReviewRow, Profile } from "@/lib/auth";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i <= rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  reviews: ReviewRow[];
  profileMap: Record<string, Profile>;
};

export function ReviewsList({ reviews, profileMap }: Props) {
  const t = useTranslations("reviews");
  const locale = useLocale();

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">{t("noReviews")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const fromUser = profileMap[review.from_user_id];
        return (
          <div
            key={review.id}
            className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              {fromUser ? (
                <Link
                  href={`/profile/${fromUser.id}`}
                  className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] hover:underline"
                >
                  {fromUser.first_name} {fromUser.last_name}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-[var(--text-primary)]">{t("unknownUser")}</span>
              )}
              <Stars rating={review.rating} />
              <span className="text-xs text-[var(--text-muted)]">
                {formatDate(review.created_at, locale)}
              </span>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-[var(--text-primary)]">{review.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
