import { PrismaClient } from "@prisma/client";
import { createAlert } from "./services/alertCreator";
import { buildJourneyMessage } from "./resolvers/journey";
import { config } from "./config";

let running = false;

async function tick(prisma: PrismaClient): Promise<void> {
  if (running) {
    return;
  }
  running = true;
  try {
    const now = new Date();

    const graceCutoff = new Date(
      now.getTime() - config.journeyGraceSeconds * 1000
    );
    const overdue = await prisma.journey.findMany({
      where: {
        status: "ACTIVE",
        expectedArrival: { lte: graceCutoff },
      },
    });

    for (const journey of overdue) {
      try {
        const confirmDeadline = new Date(
          Date.now() + config.journeyResponseWindowSeconds * 1000
        );
        const result = await prisma.journey.updateMany({
          where: { id: journey.id, status: "ACTIVE" },
          data: {
            status: "AWAITING_RESPONSE",
            confirmDeadline,
          },
        });
        if (result.count === 1) {
          console.log(
            `[TIMER] Journey ${journey.id} is overdue; now AWAITING_RESPONSE until ${confirmDeadline.toISOString()}.`
          );
        }
      } catch (err) {
        console.error(
          `[TIMER] Failed to mark journey ${journey.id} AWAITING_RESPONSE:`,
          err
        );
      }
    }

    const expired = await prisma.journey.findMany({
      where: {
        status: "AWAITING_RESPONSE",
        confirmDeadline: { lte: now },
      },
    });

    for (const journey of expired) {
      try {
        const result = await prisma.journey.updateMany({
          where: { id: journey.id, status: "AWAITING_RESPONSE" },
          data: {
            status: "ALERT_SENT",
            endedAt: new Date(),
          },
        });
        if (result.count !== 1) {
          continue;
        }

        const user = await prisma.user.findUnique({
          where: { id: journey.userId },
        });
        if (!user) {
          console.error(
            `[TIMER] Journey ${journey.id}: user ${journey.userId} not found; skipping alert.`
          );
          continue;
        }

        const mapLink = `https://maps.google.com/?q=${journey.startLat},${journey.startLng}`;
        const message = buildJourneyMessage({
          userName: user.name,
          destinationLabel: journey.destinationLabel,
          mapLink,
          type: "JOURNEY_NO_RESPONSE",
        });

        const alert = await createAlert(prisma, {
          userId: journey.userId,
          type: "JOURNEY_NO_RESPONSE",
          lat: journey.startLat,
          lng: journey.startLng,
          mapLink,
          message,
          journeyId: journey.id,
        });

        console.log(
          `[TIMER] Alert ${alert.id} (${alert.status}) created for journey ${journey.id} (user ${user.name}).`
        );
      } catch (err) {
        console.error(
          `[TIMER] Failed to escalate journey ${journey.id}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error("[TIMER] Unexpected tick error:", err);
  } finally {
    running = false;
  }
}

export function startTimer(prisma: PrismaClient): NodeJS.Timeout {
  const intervalMs = config.timerIntervalSeconds * 1000;
  console.log(
    `[TIMER] Starting journey timer. Interval ${config.timerIntervalSeconds}s, grace ${config.journeyGraceSeconds}s, response window ${config.journeyResponseWindowSeconds}s, extension ${config.journeyExtensionMinutes}m.`
  );
  tick(prisma).catch((err) =>
    console.error("[TIMER] Initial tick failed:", err)
  );
  return setInterval(() => {
    tick(prisma).catch((err) =>
      console.error("[TIMER] Scheduled tick failed:", err)
    );
  }, intervalMs);
}
