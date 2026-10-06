const url = process.env.EXPO_PUBLIC_API_URL;

if (!url) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is missing. Set it in mobile/.env and restart Expo."
  );
}

function envInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const API_URL: string = url;

export const CLIENT_CONFIG = {
  journeyGraceSeconds: envInt(
    process.env.EXPO_PUBLIC_JOURNEY_GRACE_SECONDS,
    180
  ),
  activeJourneyPollMs: 5000,
};
