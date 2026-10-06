import { GraphQLError } from "graphql";
import { Context, requireAuth } from "../context";
import { createAlert } from "../services/alertCreator";
import { AlertRecipient } from "../services/sender";

function formatAlert(alert: {
  id: string;
  type: string;
  lat: number;
  lng: number;
  mapLink: string;
  message: string;
  recipients: AlertRecipient[];
  status: string;
  createdAt: Date;
}) {
  return {
    id: alert.id,
    type: alert.type,
    lat: alert.lat,
    lng: alert.lng,
    mapLink: alert.mapLink,
    message: alert.message,
    recipients: alert.recipients,
    status: alert.status,
    createdAt: alert.createdAt.toISOString(),
  };
}

export const sosResolvers = {
  Query: {
    alerts: async (_: unknown, __: unknown, context: Context) => {
      const userId = requireAuth(context);

      const alerts = await context.prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return alerts.map((a) =>
        formatAlert({
          ...a,
          recipients: a.recipients as AlertRecipient[],
          status: a.status,
        })
      );
    },
  },

  Mutation: {
    triggerSos: async (
      _: unknown,
      args: { lat: number; lng: number },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const user = await context.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new GraphQLError("User not found");
      }

      const contacts = await context.prisma.contact.findMany({
        where: { userId },
      });
      if (contacts.length === 0) {
        throw new GraphQLError(
          "No trusted contacts added. Add at least one contact first."
        );
      }

      const mapLink = `https://maps.google.com/?q=${args.lat},${args.lng}`;
      const message =
        `SOS Alert from ${user.name}!\n\n` +
        `This is an emergency alert. ${user.name} needs help.\n\n` +
        `Location: ${mapLink}\n\n` +
        `Please check on them immediately.`;

      const alert = await createAlert(context.prisma, {
        userId,
        type: "SOS",
        lat: args.lat,
        lng: args.lng,
        mapLink,
        message,
      });

      return formatAlert(alert);
    },
  },
};
