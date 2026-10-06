import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@apollo/client";
import { HEALTH_QUERY } from "../operations";
import { colors } from "../theme";
import { API_URL } from "../config";

export function ConnectionBanner() {
  const { loading, error, data } = useQuery(HEALTH_QUERY, {
    pollInterval: 15000,
    fetchPolicy: "network-only",
  });

  if (loading && !data) {
    return (
      <View style={[styles.banner, styles.pending]}>
        <ActivityIndicator color={colors.muted} size="small" />
        <Text style={styles.pendingText}>Checking server…</Text>
      </View>
    );
  }

  if (error || data?.health !== "ok") {
    return (
      <View style={[styles.banner, styles.error]}>
        <Text style={styles.errorText}>Cannot reach server</Text>
        <Text style={styles.errorSub}>{API_URL}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.ok]}>
      <Text style={styles.okText}>Connected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pending: { backgroundColor: colors.surface },
  pendingText: { color: colors.muted, fontSize: 12 },
  ok: { backgroundColor: "#DCFCE7" },
  okText: { color: "#166534", fontSize: 12, fontWeight: "600" },
  error: { backgroundColor: "#FEE2E2", flexDirection: "column", paddingVertical: 8 },
  errorText: { color: "#991B1B", fontSize: 13, fontWeight: "700" },
  errorSub: { color: "#991B1B", fontSize: 11, marginTop: 2 },
});
