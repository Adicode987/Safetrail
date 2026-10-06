import { PrismaClient } from "@prisma/client";
import { simulateSend, AlertRecipient } from "./sender";

export type CreatedAlert = {
  id: string;
  type: string;
  lat: number;
  lng: number;
  mapLink: string;
  message: string;
  recipients: AlertRecipient[];
  status: string;
  createdAt: Date;
};

export async function createAlert(
  prisma: PrismaClient,
  params: {
    userId: string;
    type: "SOS" | "JOURNEY_NO_RESPONSE" | "USER_REQUESTED";
    lat: number;
    lng: number;
    mapLink: string;
    message: string;
    journeyId?: string;
  }
): Promise<CreatedAlert> {
  const contacts = await prisma.contact.findMany({
    where: { userId: params.userId },
  });

  const { recipients, status } = simulateSend(contacts, params.message);

  const alert = await prisma.alert.create({
    data: {
      userId: params.userId,
      journeyId: params.journeyId ?? null,
      type: params.type,
      lat: params.lat,
      lng: params.lng,
      mapLink: params.mapLink,
      message: params.message,
      recipients,
      status,
    },
  });

  return {
    id: alert.id,
    type: alert.type,
    lat: alert.lat,
    lng: alert.lng,
    mapLink: alert.mapLink,
    message: alert.message,
    recipients,
    status: alert.status,
    createdAt: alert.createdAt,
  };
}
