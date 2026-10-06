import { Platform } from "react-native";
import Constants from "expo-constants";

const isExpoGoOnAndroid =
  Platform.OS === "android" && Constants.appOwnership === "expo";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null = null;
let handlerInstalled = false;

function getNotifications(): NotificationsModule | null {
  if (isExpoGoOnAndroid) return null;
  if (notificationsModule) return notificationsModule;
  try {
    notificationsModule = require("expo-notifications") as NotificationsModule;
    return notificationsModule;
  } catch {
    return null;
  }
}

function installHandler(mod: NotificationsModule): void {
  if (handlerInstalled) return;
  try {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerInstalled = true;
  } catch {}
}

export function notificationsAvailable(): boolean {
  return getNotifications() !== null;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const mod = getNotifications();
  if (!mod) return false;
  installHandler(mod);
  try {
    const existing = await mod.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    const asked = await mod.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function ensureAndroidChannel(): Promise<void> {
  const mod = getNotifications();
  if (!mod) return;
  if (Platform.OS !== "android") return;
  try {
    await mod.setNotificationChannelAsync("safety", {
      name: "Safety alerts",
      importance: mod.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7B2CBF",
    });
  } catch {}
}

export async function scheduleAreYouSafePrompt(
  fireAt: Date,
  destinationLabel: string
): Promise<string | null> {
  const mod = getNotifications();
  if (!mod) return null;
  installHandler(mod);
  const seconds = Math.max(1, Math.floor((fireAt.getTime() - Date.now()) / 1000));
  try {
    const id = await mod.scheduleNotificationAsync({
      content: {
        title: "Are you safe?",
        body: `Did you arrive at ${destinationLabel}? Open SafeTrail to confirm.`,
        sound: true,
      },
      trigger: {
        type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: "safety",
      },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelScheduled(id: string | null): Promise<void> {
  if (!id) return;
  const mod = getNotifications();
  if (!mod) return;
  try {
    await mod.cancelScheduledNotificationAsync(id);
  } catch {}
}
