"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  locale: "fr" | "ar";
};

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2";

export function ForgotPasswordForm({ locale }: Props) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setDone(false);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
    } finally {
      setPending(false);
      setDone(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
        >
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--brand)] py-3.5 text-base font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
      >
        {pending ? t("forgotSubmitting") : t("forgotSubmit")}
      </button>

      {done ? (
        <div
          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-muted)]"
          role="status"
        >
          {t("forgotSuccess")}
        </div>
      ) : null}
    </form>
  );
}

