"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

export type ChatMessage = {
  id: string;
  role: "user" | "driver";
  text: string;
  time: string;
};

type Props = {
  shipmentId: string;
  routeTitle: string;
  /** Placeholder thread — replace with Supabase Realtime / your API. */
  initialMessages: ChatMessage[];
  driverName?: string;
  driverEta?: string;
};

export function InDriveChatShell({
  shipmentId,
  routeTitle,
  initialMessages,
  driverName = "—",
  driverEta = "—",
}: Props) {
  const t = useTranslations("chat");
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  function sendMock() {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((m) => [
      ...m,
      {
        id: `local-${Date.now()}`,
        role: "user",
        text,
        time: now,
      },
    ]);
    setDraft("");
    // Realtime: subscribe to channel `shipment:${shipmentId}` here.
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur-md sm:px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
          aria-label={t("back")}
        >
          <svg
            className="h-6 w-6 rtl:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {t("tripTitle")}
          </p>
          <p className="truncate text-xs text-slate-500">{routeTitle}</p>
        </div>
        <Link
          href="/"
          className="text-xs font-semibold text-teal-600 hover:underline"
        >
          {t("home")}
        </Link>
      </header>

      {/* Map / trip canvas — swap for Mapbox, Google Maps, etc. */}
      <div className="relative h-[38vh] min-h-[200px] w-full shrink-0 bg-gradient-to-b from-slate-200 to-slate-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow">
            {t("mapPlaceholder")}
          </p>
        </div>
        <div className="absolute bottom-3 start-3 end-3 flex justify-center">
          <div className="rounded-full bg-slate-900/85 px-4 py-2 text-center text-xs font-medium text-white shadow-lg backdrop-blur">
            {t("shipmentId", { id: shipmentId.slice(0, 8) })}
          </div>
        </div>
      </div>

      {/* Bottom sheet — InDrive-style card + chat */}
      <div className="relative z-[1] -mt-6 flex flex-1 flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.12)]">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-200" aria-hidden />

        <div className="border-b border-slate-100 px-4 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-lg font-bold text-teal-800">
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{driverName}</p>
              <p className="text-sm text-slate-500">
                {t("eta")}: <span className="font-medium">{driverEta}</span>
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              {t("statusOnline")}
            </span>
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          role="log"
          aria-label={t("messagesLabel")}
        >
          <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("demoNotice")}
          </p>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "rounded-ee-sm bg-teal-600 text-white"
                    : "rounded-es-sm bg-slate-100 text-slate-900"
                }`}
              >
                <p>{m.text}</p>
                <p
                  className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                    m.role === "user" ? "text-teal-100" : "text-slate-400"
                  }`}
                >
                  {m.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMock();
                }
              }}
              rows={1}
              placeholder={t("inputPlaceholder")}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2"
            />
            <button
              type="button"
              onClick={sendMock}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
              disabled={!draft.trim()}
              aria-label={t("send")}
            >
              <svg
                className="h-5 w-5 rtl:rotate-180"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
