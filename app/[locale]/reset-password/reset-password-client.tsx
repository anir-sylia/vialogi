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
  /** Lien refusé par Supabase dans le hash (#error / otp_expired). */
  const [fromEmailHashError, setFromEmailHashError] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = tokenHash?.trim();
    let ft: number | null = null;
    let subscription: { unsubscribe: () => void } | null = null;

    async function run() {
      if (typeof window !== "undefined") {
        const raw = window.location.hash.replace(/^#/, "");
        if (raw) {
          const p = new URLSearchParams(raw);
          if (p.get("error") || p.get("error_code")) {
            if (!cancelled) {
              const desc = (p.get("error_description") ?? "").toLowerCase();
              setFromEmailHashError(
                p.get("error_code") === "otp_expired" ||
                  desc.includes("expired") ||
                  desc.includes("invalid"),
              );
              setInvalid(true);
              setVerifying(false);
              const path = window.location.pathname + window.location.search;
              window.history.replaceState(null, "", path);
            }
            return;
          }
          /** Flux implicite : jetons dans le hash (souvent après reset e-mail), pas ?code= PKCE. */
          const access_token = p.get("access_token");
          const refresh_token = p.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (!cancelled) {
              if (error) {
                setInvalid(true);
                setVerifying(false);
              } else {
                const path =
                  window.location.pathname + window.location.search;
                window.history.replaceState(null, "", path);
                setInvalid(false);
                setVerifying(false);
              }
            }
            return;
          }
        }
      }

      if (typeof window !== "undefined") {
        const authCode = new URLSearchParams(window.location.search).get(
          "code",
        );
        if (authCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            authCode,
          );
          if (!cancelled) {
            if (error) {
              setInvalid(true);
              setVerifying(false);
            } else {
              window.history.replaceState(
                null,
                "",
                window.location.pathname,
              );
              setInvalid(false);
              setVerifying(false);
            }
          }
          return;
        }
      }

      if (token) {
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
        return;
      }

      ft = window.setTimeout(() => {
        if (!cancelled) {
          setInvalid(true);
          setVerifying(false);
        }
      }, 15000) as number;

      const handleReady = () => {
        if (cancelled) return;
        if (ft) {
          window.clearTimeout(ft);
          ft = null;
        }
        setInvalid(false);
        setVerifying(false);
      };

      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        (event) => {
          if (cancelled) return;
          if (event === "PASSWORD_RECOVERY") handleReady();
        },
      );
      subscription = sub;

      void (async () => {
        for (let i = 0; i < 20; i++) {
          if (cancelled) return;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            handleReady();
            return;
          }
          await new Promise((r) => setTimeout(r, 120));
        }
      })();
    }

    void run();

    return () => {
      cancelled = true;
      if (ft) window.clearTimeout(ft);
      subscription?.unsubscribe();
    };
  }, [supabase, tokenHash]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || verifying || invalid) return;
    if (password.trim().length < 6) return;
    setPending(true);
    setUpdateFailed(false);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setUpdateFailed(true);
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
        {fromEmailHashError ? t("resetOtpExpired") : t("resetInvalid")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {updateFailed ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {t("resetUpdateFailed")}
        </div>
      ) : null}
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
