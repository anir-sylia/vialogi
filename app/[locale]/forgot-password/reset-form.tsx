"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

type Props = {
  locale: "fr" | "ar";
};

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2";

/**
 * resetPasswordForEmail doit être appelé depuis le navigateur (PKCE) : le code_verifier
 * est stocké dans les cookies du client. Un appel serveur (API Route) ne peut pas compléter le lien du mail.
 */
export function ForgotPasswordForm({ locale }: Props) {
  const t = useTranslations("auth");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setDone(false);
    setSendFailed(false);
    try {
      const redirectTo = `${window.location.origin}/${locale}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );
      if (error) {
        console.error("resetPasswordForEmail:", error.message);
        setSendFailed(true);
      }
    } catch {
      setSendFailed(true);
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

      {done && sendFailed ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {t("forgotSendFailed")}
        </div>
      ) : null}
      {done && !sendFailed ? (
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
