import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { RealtimeChat } from "@/components/chat/RealtimeChat";
import { getShipmentById } from "@/lib/shipments";
import { getProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const shipment = await getShipmentById(id);
  if (!shipment) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect({
      href: { pathname: "/signup", query: { next: `/chat/${id}` } },
      locale,
    });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return redirect({
      href: { pathname: "/signup", query: { next: `/chat/${id}` } },
      locale,
    });
  }

  const isOwner = profile.id === shipment.user_id;
  const isTransporteur = profile.role === "transporteur";
  if (!isOwner && !isTransporteur) {
    return redirect({ href: "/", locale });
  }

  const { data: existingMessages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, message_kind, media_url")
    .eq("shipment_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const senderIds = new Set(
    (existingMessages ?? []).map((m: { sender_id: string }) => m.sender_id),
  );
  senderIds.add(user.id);
  if (shipment.user_id) senderIds.add(shipment.user_id);
  if (shipment.assigned_transporteur_id) {
    senderIds.add(shipment.assigned_transporteur_id);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, avatar_url")
    .in("id", Array.from(senderIds));

  const profileMap: Record<
    string,
    { firstName: string; lastName: string; role: string; avatarUrl: string | null }
  > = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = {
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.role,
      avatarUrl: p.avatar_url ?? null,
    };
  }

  const routeTitle = `${shipment.origin} → ${shipment.destination}`;

  const peerUserId =
    profile.id === shipment.user_id
      ? shipment.assigned_transporteur_id
      : shipment.user_id;

  const peerRpc = await supabase.rpc("get_peer_last_read_at", {
    p_shipment_id: id,
  });

  let initialPeerLastReadAt: string | null = null;
  if (!peerRpc.error && peerRpc.data != null && peerRpc.data !== "") {
    initialPeerLastReadAt =
      typeof peerRpc.data === "string" ? peerRpc.data : String(peerRpc.data);
  }

  const peerFirstName =
    peerUserId && profileMap[peerUserId]
      ? profileMap[peerUserId].firstName
      : "";

  const messages = (existingMessages ?? []).map(
    (m: {
      id: string;
      sender_id: string;
      content: string;
      created_at: string;
      message_kind?: string | null;
      media_url?: string | null;
    }) => ({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      createdAt: m.created_at,
      kind: (m.message_kind as "text" | "image" | "audio" | undefined) ?? "text",
      mediaUrl: m.media_url ?? null,
      senderName: profileMap[m.sender_id]
        ? `${profileMap[m.sender_id].firstName} ${profileMap[m.sender_id].lastName}`
        : "?",
    }),
  );

  return (
    <RealtimeChat
      shipmentId={shipment.id}
      routeTitle={routeTitle}
      currentUserId={user.id}
      currentUserName={`${profile.first_name} ${profile.last_name}`}
      initialMessages={messages}
      profileMap={profileMap}
      peerUserId={peerUserId}
      peerFirstName={peerFirstName}
      initialPeerLastReadAt={initialPeerLastReadAt}
    />
  );
}
