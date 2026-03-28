"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { signOut } from "@/lib/actions/auth";
import { isPostingEnabled } from "@/lib/posting";
import { ChatUnreadBadge } from "@/components/ChatUnreadBadge";

type UserInfo = {
  id: string;
  firstName: string;
  role: "client" | "transporteur" | "admin";
  points: number;
} | null;

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          // Session restoration can be slightly delayed right after redirects.
          if (!retryTimer) {
            retryTimer = setTimeout(() => {
              retryTimer = null;
              void loadUser();
            }, 600);
          }
          setUser(null);
          setLoading(false);
          return;
        }
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, role, points")
          .eq("id", authUser.id)
          .maybeSingle();
        if (profile) {
          setUser({
            id: authUser.id,
            firstName: profile.first_name,
            role: profile.role,
            points: profile.points ?? 0,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });
    void loadUser();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      subscription.unsubscribe();
    };
  }, []);

  const links = (
    <>
      <Link
        href="/#how"
        className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        onClick={() => setOpen(false)}
      >
        {t("howItWorks")}
      </Link>
      <Link
        href="/#network"
        className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        onClick={() => setOpen(false)}
      >
        {t("network")}
      </Link>
      <Link
        href="/#pricing"
        className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        onClick={() => setOpen(false)}
      >
        {t("pricing")}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white shadow-sm">
            V
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Vialogi
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && !user ? (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:inline"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/signup"
                className="hidden text-sm font-medium text-[var(--brand)] hover:underline lg:inline"
              >
                {t("signUp")}
              </Link>
            </>
          ) : null}

          {!loading && user && (user.role === "client" || user.role === "transporteur") ? (
            <ChatUnreadBadge />
          ) : null}

          {!loading && user ? (
            <div className="hidden items-center gap-2 lg:flex">
              {user.role === "admin" ? (
                <Link
                  href="/admin/users"
                  className="hidden text-sm font-medium text-[var(--text-muted)] hover:text-[var(--brand)] lg:inline"
                >
                  {t("adminUsers")}
                </Link>
              ) : null}
              <Link
                href={`/profile/${user.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xs font-bold text-[var(--brand)] transition-opacity hover:opacity-80"
              >
                {user.firstName.charAt(0).toUpperCase()}
              </Link>
              <span className="max-w-[100px] truncate text-sm font-medium text-[var(--text-primary)]">
                {user.firstName}
              </span>
              {user.points > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-white">
                  {user.points}
                </span>
              )}
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-red-600"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          ) : null}

          <LanguageSwitcher />

          {isPostingEnabled() && user?.role === "client" ? (
            <>
              <Link
                href={{ pathname: "/post" }}
                prefetch={true}
                className="hidden rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:inline-flex"
              >
                {t("postAnnouncement")}
              </Link>
              <Link
                href={{ pathname: "/post" }}
                prefetch={true}
                className="inline-flex rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm sm:hidden"
              >
                +
              </Link>
            </>
          ) : isPostingEnabled() && !user ? (
            <>
              <Link
                href={{ pathname: "/post" }}
                prefetch={true}
                className="hidden rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:inline-flex"
              >
                {t("postAnnouncement")}
              </Link>
              <Link
                href={{ pathname: "/post" }}
                prefetch={true}
                className="inline-flex rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm sm:hidden"
              >
                +
              </Link>
            </>
          ) : null}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-primary)] md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--header-bg)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">{links}</div>

          {!loading && user ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
              {user.role === "admin" ? (
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-[var(--brand)]"
                  onClick={() => setOpen(false)}
                >
                  {t("adminUsers")}
                </Link>
              ) : null}
              <div className="flex items-center gap-3">
              <Link
                href={`/profile/${user.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xs font-bold text-[var(--brand)]"
                onClick={() => setOpen(false)}
              >
                {user.firstName.charAt(0).toUpperCase()}
              </Link>
              <span className="flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                {user.firstName}
                {user.points > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-white">
                    {user.points}
                  </span>
                )}
              </span>
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t("logout")}
                </button>
              </form>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-3 border-t border-[var(--border)] pt-4">
              <Link
                href="/login"
                className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-center text-sm font-semibold text-[var(--text-primary)]"
                onClick={() => setOpen(false)}
              >
                {t("signIn")}
              </Link>
              <Link
                href="/signup"
                className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                {t("signUp")}
              </Link>
            </div>
          )}

          {isPostingEnabled() && (user?.role === "client" || !user) ? (
            <Link
              href={{ pathname: "/post" }}
              prefetch={true}
              className="mt-3 flex w-full items-center justify-center rounded-lg bg-[var(--brand)] py-3 text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              {t("postAnnouncement")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
