import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  InDriveChatShell,
  type ChatMessage,
} from "@/components/chat/InDriveChatShell";
import { getShipmentById } from "@/lib/shipments";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function mockMessages(t: Awaited<ReturnType<typeof getTranslations>>): ChatMessage[] {
  return [
    {
      id: "1",
      role: "driver",
      text: t("mock.driver1"),
      time: "09:41",
    },
    {
      id: "2",
      role: "user",
      text: t("mock.user1"),
      time: "09:42",
    },
    {
      id: "3",
      role: "driver",
      text: t("mock.driver2"),
      time: "09:43",
    },
  ];
}

export default async function ChatPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const shipment = await getShipmentById(id);
  if (!shipment) {
    notFound();
  }

  const t = await getTranslations("chat");
  const routeTitle = `${shipment.origin} → ${shipment.destination}`;

  return (
    <InDriveChatShell
      shipmentId={shipment.id}
      routeTitle={routeTitle}
      initialMessages={mockMessages(t)}
      driverName={t("mock.driverName")}
      driverEta={t("mock.eta")}
    />
  );
}
