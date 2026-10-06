import { Platform } from "react-native";
import * as Location from "expo-location";

export type Coords = { latitude: number; longitude: number };

export type LocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: "denied" | "disabled" | "error"; message: string };

export async function getCurrentPosition(): Promise<LocationResult> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    let granted = existing.granted;
    if (!granted) {
      if (!existing.canAskAgain) {
        return {
          ok: false,
          reason: "denied",
          message:
            "Location permission is blocked. Open your phone's app settings for SafeTrail and allow location.",
        };
      }
      const asked = await Location.requestForegroundPermissionsAsync();
      granted = asked.granted;
      if (!granted) {
        return {
          ok: false,
          reason: "denied",
          message: "Location permission is required to send an alert.",
        };
      }
    }

    let servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      if (Platform.OS === "android") {
        try {
          await Location.enableNetworkProviderAsync();
          servicesOn = await Location.hasServicesEnabledAsync();
        } catch {
          servicesOn = await Location.hasServicesEnabledAsync();
        }
      }
      if (!servicesOn) {
        return {
          ok: false,
          reason: "disabled",
          message:
            Platform.OS === "android"
              ? "Please turn on Location to send an alert."
              : "Turn on Location Services in Settings and try again.",
        };
      }
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      ok: true,
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not read your location.";
    return { ok: false, reason: "error", message };
  }
}
