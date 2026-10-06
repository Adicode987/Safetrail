function envInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[config] ${name}="${raw}" is not a positive integer; using default ${defaultValue}.`
    );
    return defaultValue;
  }
  return parsed;
}

export const config = {
  journeyGraceSeconds: envInt("JOURNEY_GRACE_SECONDS", 180),
  journeyResponseWindowSeconds: envInt("JOURNEY_RESPONSE_WINDOW_SECONDS", 90),
  journeyExtensionMinutes: envInt("JOURNEY_EXTENSION_MINUTES", 15),
  timerIntervalSeconds: envInt("TIMER_INTERVAL_SECONDS", 15),
};
