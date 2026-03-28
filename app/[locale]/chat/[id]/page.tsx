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
    .select("id, sender_id, content, created_at")
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
    .select("id, first_name, last_name, role")
    .in("id", Array.from(senderIds));

  const profileMap: Record<string, { firstName: string; lastName: string; role: string }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = {
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.role,
    };
  }

  const routeTitle = `${shipment.origin} → ${shipment.destination}`;

  const messages = (existingMessages ?? []).map(
    (m: { id: string; sender_id: string; content: string; created_at: string }) => ({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      createdAt: m.created_at,
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
    />
  );
}
