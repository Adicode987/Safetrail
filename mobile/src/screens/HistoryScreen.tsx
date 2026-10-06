import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@apollo/client";
import { ALERTS_QUERY } from "../operations";
import { colors, spacing } from "../theme";
import type { AlertRecord } from "../types";

export function HistoryScreen() {
  const { data, loading, error, refetch } = useQuery(ALERTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const alerts: AlertRecord[] = data?.alerts ?? [];

  const renderItem = ({ item }: { item: AlertRecord }) => {
    const open = !!expanded[item.id];
    const sent = item.status === "SENT";
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.typeLabel}>{describeType(item.type)}</Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: sent ? "#DCFCE7" : "#FEE2E2" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: sent ? "#166534" : "#991B1B" },
              ]}
            >
              {sent ? "Sent (simulated)" : "Failed"}
            </Text>
          </View>
        </View>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>

        {open && (
          <View style={styles.details}>
            <Text style={styles.sectionLabel}>Message</Text>
            <Text style={styles.messageText}>{item.message}</Text>

            <Text style={styles.sectionLabel}>Recipients ({item.recipients.length})</Text>
            {item.recipients.length === 0 ? (
              <Text style={styles.muted}>No contacts at send time.</Text>
            ) : (
              item.recipients.map((r, i) => (
                <View key={`${r.email}-${i}`} style={styles.recipientRow}>
                  <Text style={styles.recipientName}>{r.name}</Text>
                  <Text style={styles.recipientEmail}>{r.email}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <Text style={styles.toggleHint}>
          {open ? "Tap to collapse" : "Tap to see message & recipients"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={() => refetch()}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Alert history</Text>
            <Text style={styles.subtitle}>
              Every alert SafeTrail has sent on your behalf (simulated).
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.error}>Could not load history.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.empty}>No alerts yet.</Text>
          )
        }
      />
    </View>
  );
}

function describeType(type: string): string {
  switch (type) {
    case "SOS":
      return "SOS";
    case "JOURNEY_NO_RESPONSE":
      return "Journey — no response";
    case "USER_REQUESTED":
      return "Manual — during journey";
    default:
      return type;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  time: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  details: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  messageText: { color: colors.text, fontSize: 13, lineHeight: 18 },
  recipientRow: { paddingVertical: 4 },
  recipientName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  recipientEmail: { color: colors.muted, fontSize: 12 },
  muted: { color: colors.muted, fontSize: 13, fontStyle: "italic" },
  toggleHint: {
    fontSize: 11,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    marginTop: spacing.lg,
    fontSize: 14,
  },
  emptyBox: { alignItems: "center", marginTop: spacing.lg },
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
