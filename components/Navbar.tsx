"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

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

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main"
        >
          {links}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#login"
            className="hidden text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:inline"
          >
            {t("signIn")}
          </Link>
          <LanguageSwitcher />
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
          <Link
            href={{ pathname: "/post" }}
            prefetch={true}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-[var(--brand)] py-3 text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            {t("postAnnouncement")}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
