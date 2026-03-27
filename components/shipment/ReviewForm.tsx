"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { submitReview } from "@/lib/actions/reviews";

function SubmitBtn() {
  const { pending } = useFormStatus();
  const t = useTranslations("reviews");
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? t("submitting") : t("submit")}
    </button>
  );
}

type Props = {
  shipmentId: string;
  toUserId: string;
  toUserName: string;
  locale: string;
};

export function ReviewForm({ shipmentId, toUserId, toUserName, locale }: Props) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <form action={submitReview} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="shipment_id" value={shipmentId} />
      <input type="hidden" name="to_user_id" value={toUserId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm font-medium text-[var(--text-primary)]">
        {t("rateUser", { name: toUserName })}
      </p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`${star}/5`}
          >
            <svg
              className={`h-7 w-7 transition-colors ${
                star <= (hover || rating) ? "text-amber-400" : "text-gray-200"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={2}
        placeholder={t("commentPlaceholder")}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
      />

      <SubmitBtn />
    </form>
  );
}
