"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  shipmentId: string;
  canRemove: boolean;
  isAdmin: boolean;
};

export function ShipmentModerationActions({
  shipmentId,
  canRemove,
  isAdmin,
}: Props) {
  const t = useTranslations("shipmentDetail");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canRemove) return null;

  async function onRemove() {
    const reason = isAdmin ? window.prompt(t("removeReasonPrompt")) ?? "" : "";
    const confirmed = window.confirm(t("confirmRemove"));
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "remove_failed");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-red-700">
          {isAdmin ? t("adminModerationHint") : t("ownerRemoveHint")}
        </p>
        <button
          type="button"
          onClick={onRemove}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t("removing") : t("remove")}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-700">
          {t(`error_${error}` as "error_remove_failed")}
        </p>
      )}
    </div>
  );
}
