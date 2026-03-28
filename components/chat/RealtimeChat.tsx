"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { markChatRead } from "@/lib/actions/chat-read";
import { showAppNotification } from "@/lib/show-app-notification";

export type ChatMsg = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName: string;
};

type ProfileInfo = { firstName: string; lastName: string; role: string };

type Props = {
  shipmentId: string;
  routeTitle: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages: ChatMsg[];
  profileMap: Record<string, ProfileInfo>;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function appendDeduped(prev: ChatMsg[], msg: ChatMsg): ChatMsg[] {
  if (prev.some((m) => m.id === msg.id)) return prev;
  return [...prev, msg];
}

export function RealtimeChat({
  shipmentId,
  routeTitle,
  currentUserId,
  currentUserName,
  initialMessages,
  profileMap,
}: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef(profileMap);

  useEffect(() => {
    profilesRef.current = profileMap;
  }, [profileMap]);

  useEffect(() => {
    void (async () => {
      const r = await markChatRead(shipmentId);
      if (r.ok && typeof window !== "undefined") {
        window.dispatchEvent(new Event("vialogi:chat-read"));
      }
    })();
  }, [shipmentId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`chat:${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          let p = profilesRef.current[row.sender_id];
          if (!p) {
            const { data } = await supabase
              .from("profiles")
              .select("first_name, last_name, role")
              .eq("id", row.sender_id)
              .maybeSingle();
            if (data) {
              p = {
                firstName: data.first_name,
                lastName: data.last_name,
                role: data.role,
              };
              profilesRef.current = {
                ...profilesRef.current,
                [row.sender_id]: p,
              };
            }
          }

          const msg: ChatMsg = {
            id: row.id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: row.created_at,
            senderName: p ? `${p.firstName} ${p.lastName}` : "?",
          };

          setMessages((prev) => appendDeduped(prev, msg));

          void markChatRead(shipmentId).then((r) => {
            if (r.ok && typeof window !== "undefined") {
              window.dispatchEvent(new Event("vialogi:chat-read"));
            }
          });

          if (
            row.sender_id !== currentUserId &&
            typeof document !== "undefined" &&
            document.visibilityState === "hidden" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              const path = window.location.pathname;
              const inThisChat = path.includes(`/chat/${shipmentId}`);
              await showAppNotification({
                title: t("notificationTitle"),
                body: `${msg.senderName}: ${row.content.slice(0, 120)}${row.content.length > 120 ? "…" : ""}`,
                url: `/${locale}/chat/${shipmentId}`,
                focusOnly: inThisChat,
              });
            } catch {
              /* ignore */
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime chat channel:", status, err?.message ?? err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when room/user changes
  }, [shipmentId, currentUserId, locale]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(false);
    setDraft("");

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        shipment_id: shipmentId,
        sender_id: currentUserId,
        content: text,
      })
      .select("id, sender_id, content, created_at")
      .single();

    setSending(false);

    if (error || !data) {
      console.error("send message:", error?.message ?? error);
      setDraft(text);
      setSendError(true);
      return;
    }

    const msg: ChatMsg = {
      id: data.id,
      senderId: data.sender_id,
      content: data.content,
      createdAt: data.created_at,
      senderName: currentUserName,
    };

    setMessages((prev) => appendDeduped(prev, msg));

    void markChatRead(shipmentId).then((r) => {
      if (r.ok && typeof window !== "undefined") {
        window.dispatchEvent(new Event("vialogi:chat-read"));
      }
    });
  }

  const isMine = (msg: ChatMsg) => msg.senderId === currentUserId;

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

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-label={t("messagesLabel")}
      >
        {sendError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {t("sendFailed")}
          </p>
        ) : null}
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">
            {t("noMessages")}
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${isMine(m) ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                isMine(m)
                  ? "rounded-ee-sm bg-teal-600 text-white"
                  : "rounded-es-sm bg-white text-slate-900"
              }`}
            >
              {!isMine(m) ? (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                  {m.senderName}
                </p>
              ) : null}
              <p>{m.content}</p>
              <p
                className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                  isMine(m) ? "text-teal-100" : "text-slate-400"
                }`}
              >
                {formatTime(m.createdAt)}
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
                void sendMessage();
              }
            }}
            rows={1}
            placeholder={t("inputPlaceholder")}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={!draft.trim() || sending}
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
  );
}
