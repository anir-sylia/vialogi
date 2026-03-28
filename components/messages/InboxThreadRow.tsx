"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { hideInboxConversation } from "@/lib/actions/chat-inbox";
import type { InboxThread } from "@/lib/chat-inbox";

type Props = {
  thread: InboxThread;
  locale: string;
};

export function InboxThreadRow({ thread, locale }: Props) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t("removeConversationConfirm"))) return;
    startTransition(() => {
      void hideInboxConversation(thread.shipmentId, locale).then((r) => {
        if (r.ok) {
          router.refresh();
        } else {
          window.alert(t("removeConversationFailed"));
        }
      });
    });
  }

  return (
    <li>
      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-colors hover:border-[var(--brand)]/40 sm:gap-0">
        <Link
          href={`/chat/${thread.shipmentId}`}
          className="min-w-0 flex-1 p-4 transition-colors hover:bg-[var(--surface-muted)]"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {thread.origin} → {thread.destination}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                {thread.lastMessagePreview}
              </p>
            </div>
            <time
              className="shrink-0 text-xs text-[var(--text-muted)] sm:ml-4"
              dateTime={thread.lastMessageAt}
            >
              {new Date(thread.lastMessageAt).toLocaleString(locale, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </time>
          </div>
          <span className="mt-3 inline-block text-sm font-medium text-[var(--brand)]">
            {t("openChat")} →
          </span>
        </Link>
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="flex shrink-0 items-start justify-center border-l border-[var(--border)] px-3 py-4 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          aria-label={t("removeConversation")}
          title={t("removeConversation")}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
