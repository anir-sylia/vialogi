"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

type Props = {
  locale: "fr" | "ar";
  tokenHash: string;
};

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2";

export function ResetPasswordClient({ locale, tokenHash }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [verifying, setVerifying] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const token = tokenHash?.trim();
      if (!token) {
        if (!cancelled) {
          setInvalid(true);
          setVerifying(false);
        }
        return;
      }
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });
        if (!cancelled) setInvalid(Boolean(error));
      } catch {
        if (!cancelled) setInvalid(true);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase, tokenHash]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || verifying || invalid) return;
    if (password.trim().length < 6) return;
    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setInvalid(true);
        return;
      }
      setDone(true);
      window.setTimeout(() => {
        router.push("/login");
      }, 900);
    } finally {
      setPending(false);
    }
  }

  if (verifying) {
    return (
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-muted)]">
        {locale === "ar" ? "جاري التحقق…" : "Vérification…"}
      </div>
    );
  }

  if (invalid) {
    return (
      <div
        className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        role="alert"
      >
        {t("resetInvalid")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
        >
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {t("passwordHint")}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--brand)] py-3.5 text-base font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
      >
        {pending ? t("resetSubmitting") : t("resetSubmit")}
      </button>

      {done ? (
        <div
          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-muted)]"
          role="status"
        >
          {t("resetDone")}
        </div>
      ) : null}
    </form>
  );
}

