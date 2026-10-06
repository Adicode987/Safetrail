import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ACTIVE_JOURNEY_QUERY } from "../operations";
import { colors, spacing } from "../theme";
import { CLIENT_CONFIG } from "../config";
import { EmergencyButton } from "../components/EmergencyButton";
import { ActiveJourneyCard } from "../components/ActiveJourneyCard";
import { AreYouSafeOverlay } from "../components/AreYouSafeOverlay";
import {
  cancelScheduled,
  ensureAndroidChannel,
} from "../notifications";
import {
  forgetNotificationId,
  readNotificationId,
} from "../store";
import type { Journey } from "../types";
import type { MainStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading, error, refetch } = useQuery(ACTIVE_JOURNEY_QUERY, {
    pollInterval: CLIENT_CONFIG.activeJourneyPollMs,
    fetchPolicy: "cache-and-network",
  });
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    ensureAndroidChannel();
  }, []);

  const journey = data?.activeJourney as Journey | null | undefined;

  useEffect(() => {
    const currentStatus = journey?.status ?? null;
    const previous = prevStatusRef.current;
    const wasActive =
      previous === "ACTIVE" || previous === "AWAITING_RESPONSE";
    const nowGone = currentStatus === null;
    if (wasActive && nowGone) {
      (async () => {
        const id = await readNotificationId();
        await cancelScheduled(id);
        await forgetNotificationId();
      })();
    }
    prevStatusRef.current = currentStatus;
  }, [journey?.status]);

  const showPrompt = journey?.status === "AWAITING_RESPONSE";

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {journey && (journey.status === "ACTIVE" || journey.status === "AWAITING_RESPONSE") ? (
          <ActiveJourneyCard journey={journey} />
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate("StartJourney")}
          >
            <Text style={styles.startButtonText}>Start a Journey</Text>
            <Text style={styles.startButtonHint}>
              Tell SafeTrail where you're going and when you expect to arrive.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.center}>
          <EmergencyButton />
        </View>

        {loading && !data && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        )}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.error}>Could not load journey status.</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {showPrompt && journey && <AreYouSafeOverlay journey={journey} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  startButtonHint: {
    color: "#E9D5FF",
    fontSize: 13,
    marginTop: spacing.xs,
  },
  center: { alignItems: "center", marginTop: spacing.lg },
  errorBox: { marginTop: spacing.lg, alignItems: "center" },
  error: { color: colors.danger, fontSize: 14 },
  retry: {
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
