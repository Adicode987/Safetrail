import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing } from "../theme";
import type { MainStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<MainStackParamList>;
type R = RouteProp<MainStackParamList, "AlertSent">;

export function AlertSentScreen() {
  const navigation = useNavigation<Nav>();
  const { alert } = useRoute<R>().params;
  const sent = alert.status === "SENT";

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.banner,
            { backgroundColor: sent ? "#DCFCE7" : "#FEE2E2" },
          ]}
        >
          <Text
            style={[
              styles.bannerLabel,
              { color: sent ? "#166534" : "#991B1B" },
            ]}
          >
            {sent ? "Sent (simulated)" : "Failed"}
          </Text>
          <Text
            style={[
              styles.bannerType,
              { color: sent ? "#166534" : "#991B1B" },
            ]}
          >
            {describeType(alert.type)}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Message</Text>
        <View style={styles.card}>
          <Text style={styles.messageText}>{alert.message}</Text>
        </View>

        <Text style={styles.sectionLabel}>Recipients ({alert.recipients.length})</Text>
        <View style={styles.card}>
          {alert.recipients.length === 0 ? (
            <Text style={styles.muted}>No contacts at send time.</Text>
          ) : (
            alert.recipients.map((r, i) => (
              <View key={`${r.email}-${i}`} style={styles.recipientRow}>
                <Text style={styles.recipientName}>{r.name}</Text>
                <Text style={styles.recipientEmail}>{r.email}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionLabel}>Sent at</Text>
        <View style={styles.card}>
          <Text style={styles.timeText}>
            {new Date(alert.createdAt).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function describeType(type: string): string {
  switch (type) {
    case "SOS":
      return "SOS (emergency button)";
    case "JOURNEY_NO_RESPONSE":
      return "Journey — no response";
    case "USER_REQUESTED":
      return "Manual — sent during journey";
    default:
      return type;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  banner: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  bannerLabel: { fontSize: 20, fontWeight: "800" },
  bannerType: { fontSize: 13, marginTop: 2, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
  },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  recipientRow: { paddingVertical: 6 },
  recipientName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  recipientEmail: { color: colors.muted, fontSize: 13, marginTop: 2 },
  timeText: { color: colors.text, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 14, fontStyle: "italic" },
  doneButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
