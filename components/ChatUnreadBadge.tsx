"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const POLL_MS = 20000;

async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch("/api/chat/unread", { cache: "no-store" });
    if (!res.ok) return 0;
    const j = (await res.json()) as { count?: number };
    return typeof j.count === "number" && j.count >= 0 ? j.count : 0;
  } catch {
    return 0;
  }
}

export function ChatUnreadBadge() {
  const t = useTranslations("nav");
  const [count, setCount] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const n = await fetchUnreadCount();
      if (cancelled) return;
      const prev = prevRef.current;
      prevRef.current = n;
      setCount(n);

      if (
        n > prev &&
        prev >= 0 &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        document.visibilityState === "hidden"
      ) {
        if (Notification.permission === "granted") {
          try {
            new Notification(t("notificationNewMessage"), {
              body: t("notificationNewMessageBody"),
              tag: "vialogi-chat",
            });
          } catch {
            /* ignore */
          }
        }
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);

    const onFocus = () => void tick();
    const onRead = () => void tick();
    window.addEventListener("focus", onFocus);
    window.addEventListener("vialogi:chat-read", onRead);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("vialogi:chat-read", onRead);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const id = window.setTimeout(() => {
      void Notification.requestPermission().catch(() => {});
    }, 4000);
    return () => window.clearTimeout(id);
  }, []);

  if (count <= 0) {
    return (
      <Link
        href="/"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
        title={t("messagesInbox")}
        aria-label={t("messagesInbox")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--brand)] transition-colors hover:bg-[var(--brand)]/15"
      title={t("unreadBadge", { count })}
      aria-label={t("unreadBadge", { count })}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
