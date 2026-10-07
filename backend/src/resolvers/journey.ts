import { GraphQLError } from "graphql";
import { Context, requireAuth } from "../context";
import { createAlert } from "../services/alertCreator";
import { AlertRecipient } from "../services/sender";
import { config } from "../config";

type JourneyRow = {
  id: string;
  destinationLabel: string;
  startLat: number;
  startLng: number;
  expectedArrival: Date;
  status: string;
  confirmDeadline: Date | null;
  createdAt: Date;
  endedAt: Date | null;
};

function formatJourney(j: JourneyRow) {
  return {
    id: j.id,
    destinationLabel: j.destinationLabel,
    startLat: j.startLat,
    startLng: j.startLng,
    expectedArrival: j.expectedArrival.toISOString(),
    status: j.status,
    confirmDeadline: j.confirmDeadline ? j.confirmDeadline.toISOString() : null,
    createdAt: j.createdAt.toISOString(),
    endedAt: j.endedAt ? j.endedAt.toISOString() : null,
  };
}

function formatAlertResult(alert: {
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

export function buildJourneyMessage(params: {
  userName: string;
  destinationLabel: string;
  mapLink: string;
  type: "JOURNEY_NO_RESPONSE" | "USER_REQUESTED";
}): string {
  if (params.type === "JOURNEY_NO_RESPONSE") {
    return (
      `Safety alert for ${params.userName}.\n\n` +
      `She did not arrive at "${params.destinationLabel}" by the expected time and did not reply to the safety check.\n\n` +
      `Last known location (journey start): ${params.mapLink}\n\n` +
      `Please check on her immediately.`
    );
  }
  return (
    `Safety alert from ${params.userName}.\n\n` +
    `She manually requested help during her journey to "${params.destinationLabel}".\n\n` +
    `Last known location (journey start): ${params.mapLink}\n\n` +
    `Please check on her immediately.`
  );
}

export const journeyResolvers = {
  Query: {
    activeJourney: async (_: unknown, __: unknown, context: Context) => {
      const userId = requireAuth(context);
      const journey = await context.prisma.journey.findFirst({
        where: {
          userId,
          status: { in: ["ACTIVE", "AWAITING_RESPONSE"] },
        },
        orderBy: { createdAt: "desc" },
      });
      return journey ? formatJourney(journey) : null;
    },
  },

  Mutation: {
    startJourney: async (
      _: unknown,
      args: {
        input: {
          destinationLabel: string;
          startLat: number;
          startLng: number;
          expectedArrival: string;
        };
      },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const label = args.input.destinationLabel.trim();
      if (label.length === 0) {
        throw new GraphQLError("Destination label is required.");
      }

      const expected = new Date(args.input.expectedArrival);
      if (Number.isNaN(expected.getTime())) {
        throw new GraphQLError("expectedArrival is not a valid date.");
      }
      if (expected.getTime() <= Date.now()) {
        throw new GraphQLError("expectedArrival must be in the future.");
      }

      const existing = await context.prisma.journey.findFirst({
        where: {
          userId,
          status: { in: ["ACTIVE", "AWAITING_RESPONSE"] },
        },
      });
      if (existing) {
        throw new GraphQLError(
          "You already have an active journey. End it before starting a new one."
        );
      }

      const journey = await context.prisma.journey.create({
        data: {
          userId,
          destinationLabel: label,
          startLat: args.input.startLat,
          startLng: args.input.startLng,
          expectedArrival: expected,
          status: "ACTIVE",
        },
      });
      return formatJourney(journey);
    },

    markArrived: async (
      _: unknown,
      args: { journeyId: string },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const journey = await context.prisma.journey.findUnique({
        where: { id: args.journeyId },
      });
      if (!journey || journey.userId !== userId) {
        throw new GraphQLError("Journey not found.");
      }

      const result = await context.prisma.journey.updateMany({
        where: {
          id: args.journeyId,
          status: { in: ["ACTIVE", "AWAITING_RESPONSE"] },
        },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
          confirmDeadline: null,
        },
      });
      if (result.count !== 1) {
        throw new GraphQLError("This journey is already finished.");
      }

      const updated = await context.prisma.journey.findUniqueOrThrow({
        where: { id: args.journeyId },
      });
      return formatJourney(updated);
    },

    confirmSafe: async (
      _: unknown,
      args: { journeyId: string },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const journey = await context.prisma.journey.findUnique({
        where: { id: args.journeyId },
      });
      if (!journey || journey.userId !== userId) {
        throw new GraphQLError("Journey not found.");
      }

      const newExpected = new Date(
        Date.now() + config.journeyExtensionMinutes * 60 * 1000
      );

      const result = await context.prisma.journey.updateMany({
        where: {
          id: args.journeyId,
          status: "AWAITING_RESPONSE",
        },
        data: {
          status: "ACTIVE",
          expectedArrival: newExpected,
          confirmDeadline: null,
        },
      });
      if (result.count !== 1) {
        throw new GraphQLError(
          "confirmSafe is only allowed while the journey is awaiting your response."
        );
      }

      const updated = await context.prisma.journey.findUniqueOrThrow({
        where: { id: args.journeyId },
      });
      return formatJourney(updated);
    },

    sendAlertNow: async (
      _: unknown,
      args: { journeyId: string; lat: number; lng: number },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const journey = await context.prisma.journey.findUnique({
        where: { id: args.journeyId },
      });
      if (!journey || journey.userId !== userId) {
        throw new GraphQLError("Journey not found.");
      }

      const user = await context.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });

      const contacts = await context.prisma.contact.findMany({
        where: { userId },
      });
      if (contacts.length === 0) {
        throw new GraphQLError(
          "No trusted contacts added. Add at least one contact first."
        );
      }

      const result = await context.prisma.journey.updateMany({
        where: {
          id: args.journeyId,
          status: { in: ["ACTIVE", "AWAITING_RESPONSE"] },
        },
        data: {
          status: "ALERT_SENT",
          endedAt: new Date(),
          confirmDeadline: null,
        },
      });
      if (result.count !== 1) {
        throw new GraphQLError(
          "Could not send alert — the journey is already finished."
        );
      }

      const mapLink = `https://maps.google.com/?q=${args.lat},${args.lng}`;
      const message = buildJourneyMessage({
        userName: user.name,
        destinationLabel: journey.destinationLabel,
        mapLink,
        type: "USER_REQUESTED",
      });

      const alert = await createAlert(context.prisma, {
        userId,
        type: "USER_REQUESTED",
        lat: args.lat,
        lng: args.lng,
        mapLink,
        message,
        journeyId: journey.id,
      });

      return formatAlertResult(alert);
    },
  },
};
