import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  MARK_ARRIVED_MUTATION,
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

export function ActiveJourneyCard({ journey }: { journey: Journey }) {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState<"arrived" | "sending" | null>(null);
  const [markArrived] = useMutation(MARK_ARRIVED_MUTATION, {
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

  const handleArrived = async () => {
    setBusy("arrived");
    try {
      await markArrived({ variables: { journeyId: journey.id } });
      await cancelNotif();
    } catch (err: unknown) {
      Alert.alert(
        "Could not mark arrived",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSendNow = async () => {
    Alert.alert(
      "Send alert now?",
      "Your trusted contacts will be notified immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "destructive",
          onPress: async () => {
            setBusy("sending");
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
              const alert = result.data?.sendAlertNow as
                | AlertRecord
                | undefined;
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
          },
        },
      ]
    );
  };

  const expected = new Date(journey.expectedArrival);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.badge}>ACTIVE JOURNEY</Text>
      </View>
      <Text style={styles.destination}>{journey.destinationLabel}</Text>
      <Text style={styles.timeLabel}>Expected arrival</Text>
      <Text style={styles.time}>{formatTime(expected)}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.arrived, busy && styles.disabled]}
          onPress={handleArrived}
          disabled={!!busy}
        >
          {busy === "arrived" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>I've Arrived</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.sendNow, busy && styles.disabled]}
          onPress={handleSendNow}
          disabled={!!busy}
        >
          {busy === "sending" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Alert Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " +
    d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  header: { marginBottom: spacing.sm },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.success,
    letterSpacing: 1,
  },
  destination: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  time: { fontSize: 15, color: colors.text, marginTop: 2 },
  buttons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  arrived: { backgroundColor: colors.success },
  sendNow: { backgroundColor: colors.danger },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
