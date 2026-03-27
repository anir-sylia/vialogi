"use client";

import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { submitOffer } from "@/lib/actions/offers";

function SubmitBtn() {
  const { pending } = useFormStatus();
  const t = useTranslations("offers");
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
  locale: string;
};

export function OfferForm({ shipmentId, locale }: Props) {
  const t = useTranslations("offers");

  return (
    <form action={submitOffer} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="shipment_id" value={shipmentId} />
      <div className="flex-1">
        <label htmlFor="offer-price" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          {t("priceLabel")} (MAD)
        </label>
        <input
          id="offer-price"
          name="price"
          type="number"
          min="1"
          step="0.01"
          required
          placeholder={t("pricePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
        />
      </div>
      <SubmitBtn />
    </form>
  );
}
