"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { markChatRead } from "@/lib/actions/chat-read";
import { showAppNotification } from "@/lib/show-app-notification";
import { uploadChatMedia } from "@/lib/chat-upload";

export type ChatMsg = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName: string;
  kind: "text" | "image" | "audio";
  mediaUrl: string | null;
};

type ProfileInfo = {
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
};

type Props = {
  shipmentId: string;
  routeTitle: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages: ChatMsg[];
  profileMap: Record<string, ProfileInfo>;
  peerUserId: string | null;
  peerFirstName: string;
  initialPeerLastReadAt: string | null;
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

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
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
  peerUserId,
  peerFirstName,
  initialPeerLastReadAt,
}: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(
    initialPeerLastReadAt,
  );
  const [peerTyping, setPeerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef(profileMap);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signalChannelRef = useRef<RealtimeChannel | null>(null);
  const [signalReady, setSignalReady] = useState(false);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    profilesRef.current = profileMap;
  }, [profileMap]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, peerTyping]);

  /* Canal dédié aux INSERT messages — sans config broadcast (évite les conflits Realtime). */
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`chat-msg:${shipmentId}`)
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
            message_kind?: string | null;
            media_url?: string | null;
          };

          let p = profilesRef.current[row.sender_id];
          if (!p) {
            const { data } = await supabase
              .from("profiles")
              .select("first_name, last_name, role, avatar_url")
              .eq("id", row.sender_id)
              .maybeSingle();
            if (data) {
              p = {
                firstName: data.first_name,
                lastName: data.last_name,
                role: data.role,
                avatarUrl: data.avatar_url ?? null,
              };
              profilesRef.current = {
                ...profilesRef.current,
                [row.sender_id]: p,
              };
            }
          }

          const kind =
            (row.message_kind as ChatMsg["kind"] | undefined) ?? "text";
          const msg: ChatMsg = {
            id: row.id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: row.created_at,
            senderName: p ? `${p.firstName} ${p.lastName}` : "?",
            kind: kind === "image" || kind === "audio" ? kind : "text",
            mediaUrl: row.media_url ?? null,
          };

          setMessages((prev) => appendDeduped(prev, msg));

          void markChatRead(shipmentId).then((r) => {
            if (r.ok && typeof window !== "undefined") {
              window.dispatchEvent(new Event("vialogi:chat-read"));
              const ch = signalChannelRef.current;
              if (ch) {
                void ch.send({
                  type: "broadcast",
                  event: "read",
                  payload: {
                    userId: currentUserId,
                    lastReadAt: new Date().toISOString(),
                  },
                });
              }
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
              const preview =
                kind === "image"
                  ? t("notificationImage")
                  : kind === "audio"
                    ? t("notificationAudio")
                    : `${row.content.slice(0, 120)}${row.content.length > 120 ? "…" : ""}`;
              await showAppNotification({
                title: t("notificationTitle"),
                body: `${msg.senderName}: ${preview}`,
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
          console.error("Realtime messages channel:", status, err?.message ?? err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when room/user changes
  }, [shipmentId, currentUserId, locale, peerUserId]);

  /* Canal séparé pour broadcast (typing + accusés) — ne mélange pas avec postgres_changes. */
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`chat-signal:${shipmentId}`, {
        config: { broadcast: { ack: false } },
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { userId?: string; typing?: boolean };
        if (!p.userId || p.userId === currentUserId) return;
        if (peerUserId && p.userId !== peerUserId) return;
        setPeerTyping(!!p.typing);
        if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
        if (p.typing) {
          peerTypingClearRef.current = setTimeout(() => setPeerTyping(false), 4000);
        }
      })
      .on("broadcast", { event: "read" }, ({ payload }) => {
        const p = payload as { userId?: string; lastReadAt?: string };
        if (!p.userId || !p.lastReadAt) return;
        if (p.userId === currentUserId) return;
        if (peerUserId && p.userId !== peerUserId) return;
        setPeerLastReadAt((prev) => {
          const next = p.lastReadAt!;
          if (!prev) return next;
          return new Date(next) > new Date(prev) ? next : prev;
        });
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          signalChannelRef.current = channel;
          setSignalReady(true);
          void markChatRead(shipmentId).then((r) => {
            if (r.ok && typeof window !== "undefined") {
              window.dispatchEvent(new Event("vialogi:chat-read"));
              void channel.send({
                type: "broadcast",
                event: "read",
                payload: {
                  userId: currentUserId,
                  lastReadAt: new Date().toISOString(),
                },
              });
            }
          });
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime signal channel:", status, err?.message ?? err);
        }
      });

    return () => {
      signalChannelRef.current = null;
      setSignalReady(false);
      if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when room/user changes
  }, [shipmentId, currentUserId, peerUserId]);

  useEffect(() => {
    if (!signalReady) return;
    const ch = signalChannelRef.current;
    if (!ch || isRecording) return;
    if (!draft.trim()) {
      void ch.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing: false },
      });
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
      return;
    }
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, typing: true },
    });
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = setTimeout(() => {
      void ch.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing: false },
      });
    }, 2500);
    return () => {
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    };
  }, [draft, isRecording, currentUserId, signalReady]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      mediaRecorderRef.current?.stop();
      recordStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function insertMessage(
    kind: ChatMsg["kind"],
    content: string,
    mediaUrl: string | null,
  ) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        shipment_id: shipmentId,
        sender_id: currentUserId,
        content: content || "",
        message_kind: kind,
        media_url: mediaUrl,
      })
      .select("id, sender_id, content, created_at, message_kind, media_url")
      .single();

    if (error || !data) {
      console.error("send message:", error?.message ?? error);
      return false;
    }

    const msg: ChatMsg = {
      id: data.id,
      senderId: data.sender_id,
      content: data.content,
      createdAt: data.created_at,
      senderName: currentUserName,
      kind:
        (data.message_kind as ChatMsg["kind"]) === "image" ||
        (data.message_kind as ChatMsg["kind"]) === "audio"
          ? (data.message_kind as ChatMsg["kind"])
          : "text",
      mediaUrl: data.media_url ?? null,
    };

    setMessages((prev) => appendDeduped(prev, msg));

    void markChatRead(shipmentId).then((r) => {
      if (r.ok && typeof window !== "undefined") {
        window.dispatchEvent(new Event("vialogi:chat-read"));
        const ch = signalChannelRef.current;
        if (ch) {
          void ch.send({
            type: "broadcast",
            event: "read",
            payload: {
              userId: currentUserId,
              lastReadAt: new Date().toISOString(),
            },
          });
        }
      }
    });
    return true;
  }

  function isReadByPeer(m: ChatMsg): boolean {
    if (!peerLastReadAt) return false;
    try {
      return new Date(peerLastReadAt) >= new Date(m.createdAt);
    } catch {
      return false;
    }
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(false);
    setDraft("");

    const ok = await insertMessage("text", text, null);
    setSending(false);

    if (!ok) {
      setDraft(text);
      setSendError(true);
    }
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/") || uploading) return;

    setUploading(true);
    setSendError(false);
    const caption = draft.trim();
    setDraft("");

    const up = await uploadChatMedia(shipmentId, file, file.type);
    setUploading(false);

    if ("error" in up) {
      setSendError(true);
      setDraft(caption);
      return;
    }

    const ok = await insertMessage("image", caption, up.publicUrl);
    if (!ok) {
      setSendError(true);
      setDraft(caption);
    }
  }

  async function toggleRecording() {
    if (uploading || sending) return;

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordStreamRef.current = stream;
        recordChunksRef.current = [];
        const mime =
          MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/webm")
              ? "audio/webm"
              : "audio/mp4";
        const rec = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = rec;
        rec.ondataavailable = (ev) => {
          if (ev.data.size) recordChunksRef.current.push(ev.data);
        };
        rec.start(200);
        setIsRecording(true);
        setRecordSec(0);
        recordTimerRef.current = setInterval(() => {
          setRecordSec((s) => s + 1);
        }, 1000);
      } catch {
        setSendError(true);
      }
      return;
    }

    const rec = mediaRecorderRef.current;
    const stream = recordStreamRef.current;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordSec(0);

    if (!rec || rec.state === "inactive") {
      stream?.getTracks().forEach((tr) => tr.stop());
      return;
    }

    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream?.getTracks().forEach((tr) => tr.stop());

    const chunks = recordChunksRef.current;
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    setUploading(true);
    setSendError(false);
    const up = await uploadChatMedia(shipmentId, blob, blob.type);
    setUploading(false);

    if ("error" in up) {
      setSendError(true);
      return;
    }

    await insertMessage("audio", "", up.publicUrl);
  }

  const isMine = (msg: ChatMsg) => msg.senderId === currentUserId;

  function avatarFor(senderId: string) {
    const p = profilesRef.current[senderId];
    const name = p ? `${p.firstName} ${p.lastName}` : "?";
    const url = p?.avatarUrl;
    if (url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      );
    }
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-teal-700 text-xs font-bold text-white shadow-sm ring-2 ring-white"
        aria-hidden
      >
        {initials(name)}
      </div>
    );
  }

  function showAvatarForIndex(i: number, senderId: string) {
    const prev = messages[i - 1];
    return !prev || prev.senderId !== senderId;
  }

  return (
    <div
      className="flex min-h-0 flex-col bg-[#e5e5e7] dark:bg-slate-900"
      style={{ height: "calc(100dvh - 4rem)" }}
    >
      <header className="z-10 flex shrink-0 items-center gap-2 border-b border-slate-200/90 bg-white/95 px-2 py-2.5 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
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
          <p className="truncate text-[15px] font-bold leading-tight text-slate-900">
            {t("tripTitle")}
          </p>
          <p className="truncate text-xs text-slate-500">{routeTitle}</p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-full px-2 py-1.5 text-xs font-semibold text-[#0084ff] hover:bg-blue-50"
        >
          {t("home")}
        </Link>
      </header>

      {peerTyping ? (
        <div
          className="shrink-0 border-b border-slate-200/80 bg-slate-100/95 px-4 py-2 text-center text-xs font-medium text-slate-600"
          role="status"
        >
          <span className="inline-flex items-center gap-1">
            {t("peerTyping", { name: peerFirstName || t("counterparty") })}
            <span className="inline-flex translate-y-[-2px] gap-0.5">
              <span className="animate-pulse">·</span>
              <span className="animate-pulse [animation-delay:200ms]">·</span>
              <span className="animate-pulse [animation-delay:400ms]">·</span>
            </span>
          </span>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4"
        role="log"
        aria-label={t("messagesLabel")}
        dir="ltr"
      >
        {sendError ? (
          <p className="mb-2 rounded-2xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {t("sendFailed")}
          </p>
        ) : null}
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {t("noMessages")}
          </p>
        ) : null}

        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {messages.map((m, i) => {
            const mine = isMine(m);
            const showAv = showAvatarForIndex(i, m.senderId);
            return (
              <div
                key={m.id}
                className={`flex w-full items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex w-9 shrink-0 flex-col ${showAv ? "opacity-100" : "opacity-0"}`}
                  aria-hidden={!showAv}
                >
                  {showAv ? avatarFor(m.senderId) : <span className="h-9 w-9" />}
                </div>

                <div
                  className={`flex max-w-[min(78%,20rem)] flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  {!mine && showAv ? (
                    <span className="mb-0.5 px-1 text-[11px] font-semibold text-slate-500">
                      {m.senderName}
                    </span>
                  ) : null}

                  <div
                    className={`overflow-hidden rounded-[18px] px-3 py-2 shadow-sm ${
                      mine
                        ? "rounded-br-sm bg-[#0084ff] text-white"
                        : "rounded-bl-sm bg-white text-slate-900"
                    }`}
                  >
                    {m.kind === "image" && m.mediaUrl ? (
                      <div className="space-y-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.mediaUrl}
                          alt=""
                          className="max-h-56 max-w-full rounded-xl object-cover"
                        />
                        {m.content?.trim() ? (
                          <p className="text-sm">{m.content}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {m.kind === "audio" && m.mediaUrl ? (
                      <audio
                        src={m.mediaUrl}
                        controls
                        className="h-9 w-[min(100%,220px)] max-w-full"
                        preload="metadata"
                      />
                    ) : null}
                    {m.kind === "text" ? (
                      <p className="wrap-break-word whitespace-pre-wrap text-[15px] leading-snug">
                        {m.content}
                      </p>
                    ) : null}

                    <div
                      className={`mt-1 flex items-center gap-1.5 ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-medium ${
                          mine ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                      {mine ? (
                        <span
                          className={`select-none text-[13px] leading-none ${
                            isReadByPeer(m) ? "text-sky-100" : "text-blue-200/90"
                          }`}
                          title={isReadByPeer(m) ? t("read") : t("delivered")}
                          aria-label={isReadByPeer(m) ? t("read") : t("delivered")}
                        >
                          {isReadByPeer(m) ? "✓✓" : "✓"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200/80 bg-[#f0f2f5] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
        {isRecording ? (
          <div className="mx-auto mb-2 flex max-w-3xl items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {t("recording")} {recordSec}s
          </div>
        ) : null}

        <div className="mx-auto flex max-w-3xl items-end gap-1.5 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onPickPhoto(e)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending || isRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40"
            aria-label={t("attachPhoto")}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => void toggleRecording()}
            disabled={uploading || sending}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-200"
            } disabled:opacity-40`}
            aria-label={isRecording ? t("stopRecording") : t("voiceMessage")}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </button>

          <div className="relative min-h-[44px] flex-1 rounded-[22px] border border-slate-200/90 bg-white shadow-inner">
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
              disabled={isRecording}
              className="max-h-32 min-h-[44px] w-full resize-none rounded-[22px] bg-transparent px-4 py-3 pr-12 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => void sendMessage()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={!draft.trim() || sending || uploading || isRecording}
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
        {uploading ? (
          <p className="mt-1 text-center text-xs text-slate-500">{t("uploading")}</p>
        ) : null}
      </div>
    </div>
  );
}
