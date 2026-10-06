import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  START_JOURNEY_MUTATION,
  ACTIVE_JOURNEY_QUERY,
} from "../operations";
import { getCurrentPosition } from "../location";
import {
  ensureAndroidChannel,
  ensureNotificationPermission,
  scheduleAreYouSafePrompt,
} from "../notifications";
import { rememberNotificationId } from "../store";
import { CLIENT_CONFIG } from "../config";
import { colors, spacing } from "../theme";
import type { MainStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function StartJourneyScreen() {
  const navigation = useNavigation<Nav>();
  const [label, setLabel] = useState("");
  const [expected, setExpected] = useState<Date>(
    () => new Date(Date.now() + 60 * 1000)
  );
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startJourney] = useMutation(START_JOURNEY_MUTATION, {
    refetchQueries: [{ query: ACTIVE_JOURNEY_QUERY }],
  });

  const quickSet = (minutes: number) => {
    setExpected(new Date(Date.now() + minutes * 60 * 1000));
  };

  const onPicker = (event: unknown, selected?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (selected) {
      let candidate = new Date();
      candidate.setHours(selected.getHours());
      candidate.setMinutes(selected.getMinutes());
      candidate.setSeconds(0);
      candidate.setMilliseconds(0);
      if (candidate.getTime() <= Date.now()) {
        candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
      }
      setExpected(candidate);
    }
  };

  const submit = async () => {
    setError(null);
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Enter a destination label.");
      return;
    }
    if (expected.getTime() <= Date.now()) {
      setError("Expected arrival must be in the future.");
      return;
    }

    setSubmitting(true);
    const loc = await getCurrentPosition();
    if (!loc.ok) {
      setError(loc.message);
      setSubmitting(false);
      return;
    }

    try {
      await startJourney({
        variables: {
          input: {
            destinationLabel: trimmed,
            startLat: loc.coords.latitude,
            startLng: loc.coords.longitude,
            expectedArrival: expected.toISOString(),
          },
        },
      });

      const granted = await ensureNotificationPermission();
      if (granted) {
        await ensureAndroidChannel();
        const fireAt = new Date(
          expected.getTime() + CLIENT_CONFIG.journeyGraceSeconds * 1000
        );
        const notifId = await scheduleAreYouSafePrompt(fireAt, trimmed);
        if (notifId) {
          await rememberNotificationId(notifId);
        }
      }

      navigation.goBack();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? describeNetworkError(err.message)
          : "Could not start the journey."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Start a journey</Text>
        <Text style={styles.subtitle}>
          Tell SafeTrail where you're going and when you expect to arrive.
        </Text>

        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g., Home, Office, Metro Station"
          placeholderTextColor={colors.muted}
          editable={!submitting}
        />

        <Text style={styles.label}>Expected arrival</Text>
        <TouchableOpacity
          style={styles.timeBox}
          onPress={() => setShowPicker(true)}
          disabled={submitting}
        >
          <Text style={styles.timeText}>{formatFull(expected)}</Text>
          <Text style={styles.timeHint}>Tap to change</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={expected}
            mode="time"
            is24Hour={false}
            onChange={onPicker}
          />
        )}

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quick}
            onPress={() => quickSet(1)}
            disabled={submitting}
          >
            <Text style={styles.quickText}>in 1 minute</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quick}
            onPress={() => quickSet(2)}
            disabled={submitting}
          >
            <Text style={styles.quickText}>in 2 minutes</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submit, submitting && styles.disabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Start Journey</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancel}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function describeNetworkError(message: string): string {
  if (/Network request failed/i.test(message) || /fetch/i.test(message)) {
    return "Cannot reach the server. Check your Wi-Fi and the backend URL.";
  }
  return message;
}

function formatFull(d: Date): string {
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
  let relative: string;
  if (diffSec < 60) relative = "in less than a minute";
  else if (diffSec < 60 * 60) relative = `in ${Math.round(diffSec / 60)} min`;
  else relative = `in ${Math.round(diffSec / 3600)} h`;
  return `${time} ${sameDay ? "today" : date} (${relative})`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  timeBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  timeText: { fontSize: 16, color: colors.text, fontWeight: "600" },
  timeHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  quick: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  quickText: { color: colors.primary, fontWeight: "700" },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    fontSize: 14,
  },
  submit: {
    backgroundColor: colors.primary,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancel: {
    marginTop: spacing.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
});
