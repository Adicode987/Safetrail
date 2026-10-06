import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TRIGGER_SOS_MUTATION, ALERTS_QUERY } from "../operations";
import { getCurrentPosition } from "../location";
import { colors, spacing } from "../theme";
import type { MainStackParamList } from "../navigation";
import type { AlertRecord } from "../types";

const COUNTDOWN_SECONDS = 6;

type Nav = NativeStackNavigationProp<MainStackParamList>;

type Phase = "idle" | "counting" | "sending";

export function EmergencyButton() {
  const navigation = useNavigation<Nav>();
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState<number>(COUNTDOWN_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const [triggerSos] = useMutation(TRIGGER_SOS_MUTATION, {
    refetchQueries: [{ query: ALERTS_QUERY }],
  });

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const startCountdown = () => {
    setError(null);
    cancelledRef.current = false;
    setPhase("counting");
    setRemaining(COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          if (!cancelledRef.current) {
            fire();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  const cancel = () => {
    cancelledRef.current = true;
    clearTimer();
    setPhase("idle");
    setRemaining(COUNTDOWN_SECONDS);
  };

  const fire = async () => {
    setPhase("sending");
    const loc = await getCurrentPosition();
    if (!loc.ok) {
      setError(loc.message);
      setPhase("idle");
      return;
    }
    try {
      const result = await triggerSos({
        variables: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      });
      const alert = result.data?.triggerSos as AlertRecord | undefined;
      setPhase("idle");
      if (alert) {
        navigation.navigate("AlertSent", { alert });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? describeNetworkError(err.message)
          : "Could not send alert."
      );
      setPhase("idle");
    }
  };

  if (phase === "counting") {
    return (
      <View style={styles.wrap}>
        <View style={[styles.button, styles.counting]}>
          <Text style={styles.countdownLabel}>Sending in</Text>
          <Text style={styles.countdownNumber}>{remaining}</Text>
        </View>
        <TouchableOpacity style={styles.cancel} onPress={cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "sending") {
    return (
      <View style={styles.wrap}>
        <View style={[styles.button, styles.sending]}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.sendingText}>Sending alert…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.button, styles.idle]}
        onPress={startCountdown}
        activeOpacity={0.8}
      >
        <Text style={styles.idleLabel}>EMERGENCY</Text>
        <Text style={styles.idleHint}>{COUNTDOWN_SECONDS}s cancel window</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function describeNetworkError(message: string): string {
  if (/Network request failed/i.test(message) || /fetch/i.test(message)) {
    return "Cannot reach the server. Check your Wi-Fi and the backend URL.";
  }
  return message;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: colors.danger,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  idle: { backgroundColor: colors.danger },
  idleLabel: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 2 },
  idleHint: { color: "#FEE2E2", fontSize: 12, marginTop: spacing.sm },
  counting: { backgroundColor: "#991B1B" },
  countdownLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  countdownNumber: {
    color: "#fff",
    fontSize: 90,
    fontWeight: "900",
    marginTop: 4,
  },
  sending: { backgroundColor: colors.danger },
  sendingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  cancel: {
    marginTop: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
    backgroundColor: colors.text,
  },
  cancelText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
});
