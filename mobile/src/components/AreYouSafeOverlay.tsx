import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CONFIRM_SAFE_MUTATION,
  SEND_ALERT_NOW_MUTATION,
  ACTIVE_JOURNEY_QUERY,
  ALERTS_QUERY,
} from "../operations";
import { colors, spacing } from "../theme";
import { cancelScheduled } from "../notifications";
import { forgetNotificationId, readNotificationId } from "../store";
import { getCurrentPosition } from "../location";
import type { Journey, AlertRecord } from "../types";
import type { MainStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function AreYouSafeOverlay({ journey }: { journey: Journey }) {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState<"safe" | "alert" | null>(null);
  const [confirmSafe] = useMutation(CONFIRM_SAFE_MUTATION, {
    refetchQueries: [{ query: ACTIVE_JOURNEY_QUERY }],
  });
  const [sendAlertNow] = useMutation(SEND_ALERT_NOW_MUTATION, {
    refetchQueries: [
      { query: ACTIVE_JOURNEY_QUERY },
      { query: ALERTS_QUERY },
    ],
  });

  const cancelNotif = async () => {
    const id = await readNotificationId();
    await cancelScheduled(id);
    await forgetNotificationId();
  };

  const handleSafe = async () => {
    setBusy("safe");
    try {
      await confirmSafe({ variables: { journeyId: journey.id } });
    } catch (err: unknown) {
      Alert.alert(
        "Could not confirm",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSendAlert = async () => {
    setBusy("alert");
    try {
      const loc = await getCurrentPosition();
      if (!loc.ok) {
        Alert.alert("Location needed", loc.message);
        setBusy(null);
        return;
      }
      const result = await sendAlertNow({
        variables: {
          journeyId: journey.id,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        },
      });
      await cancelNotif();
      const alert = result.data?.sendAlertNow as AlertRecord | undefined;
      if (alert) {
        navigation.navigate("AlertSent", { alert });
      }
    } catch (err: unknown) {
      Alert.alert(
        "Could not send alert",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setBusy(null);
    }
  };

  const deadline = journey.confirmDeadline
    ? new Date(journey.confirmDeadline)
    : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.badge}>SAFETY CHECK</Text>
          <Text style={styles.title}>Are you safe?</Text>
          <Text style={styles.subtitle}>
            You were expected at {journey.destinationLabel}. Tap below so we know
            you're okay. If you don't respond, we'll alert your contacts.
          </Text>
          {deadline && (
            <CountdownLine deadline={deadline} />
          )}

          <TouchableOpacity
            style={[styles.button, styles.safe, busy && styles.disabled]}
            onPress={handleSafe}
            disabled={!!busy}
          >
            {busy === "safe" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>I'm Safe</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.alertBtn, busy && styles.disabled]}
            onPress={handleSendAlert}
            disabled={!!busy}
          >
            {busy === "alert" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Alert</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CountdownLine({ deadline }: { deadline: Date }) {
  const [now, setNow] = useState<number>(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.floor((deadline.getTime() - now) / 1000));
  return (
    <Text style={styles.countdown}>
      Auto-alert in {remaining} second{remaining === 1 ? "" : "s"}
    </Text>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.warning,
    letterSpacing: 1,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  countdown: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.md,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: spacing.md,
  },
  safe: { backgroundColor: colors.success },
  alertBtn: { backgroundColor: colors.danger },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
