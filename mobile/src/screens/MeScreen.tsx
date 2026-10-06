import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useQuery, useApolloClient } from "@apollo/client";
import { ME_QUERY } from "../operations";
import { useAuth } from "../store";
import { colors, spacing } from "../theme";

export function MeScreen() {
  const signOut = useAuth((s) => s.signOut);
  const apollo = useApolloClient();
  const { data, loading, error, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const handleSignOut = async () => {
    await signOut();
    await apollo.clearStore();
  };

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Could not load your profile.</Text>
        <Text style={styles.errorSub}>{error.message}</Text>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const me = data?.me;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hi, {me?.name ?? "there"}</Text>
      <Text style={styles.subtitle}>You are logged in to SafeTrail.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Name</Text>
        <Text style={styles.cardValue}>{me?.name ?? "—"}</Text>
        <View style={styles.divider} />
        <Text style={styles.cardLabel}>Email</Text>
        <Text style={styles.cardValue}>{me?.email ?? "—"}</Text>
        <View style={styles.divider} />
        <Text style={styles.cardLabel}>Phone</Text>
        <Text style={styles.cardValue}>{me?.phone ?? "Not set"}</Text>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  content: { padding: spacing.lg },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: 15,
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
  },
  cardLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardValue: { fontSize: 16, color: colors.text, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  signOut: {
    marginTop: spacing.xl,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  errorSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  retry: {
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
