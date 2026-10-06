import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADD_CONTACT_MUTATION,
  CONTACTS_QUERY,
  REMOVE_CONTACT_MUTATION,
} from "../operations";
import { colors, spacing } from "../theme";
import { emailError, phoneError } from "../validation";

const MAX_CONTACTS = 5;

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export function ContactsScreen() {
  const { data, loading, error, refetch } = useQuery(CONTACTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [addContact, { loading: adding }] = useMutation(ADD_CONTACT_MUTATION, {
    refetchQueries: [{ query: CONTACTS_QUERY }],
  });
  const [removeContact] = useMutation(REMOVE_CONTACT_MUTATION, {
    refetchQueries: [{ query: CONTACTS_QUERY }],
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const contacts: Contact[] = data?.contacts ?? [];
  const atLimit = contacts.length >= MAX_CONTACTS;

  const submit = async () => {
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const emailProblem = emailError(email);
    if (emailProblem) {
      setFormError(emailProblem);
      return;
    }
    const phoneProblem = phoneError(phone, false);
    if (phoneProblem) {
      setFormError(phoneProblem);
      return;
    }
    try {
      await addContact({
        variables: {
          input: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
          },
        },
      });
      setName("");
      setEmail("");
      setPhone("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not add contact.");
    }
  };

  const confirmRemove = (contact: Contact) => {
    Alert.alert(
      "Remove contact",
      `Remove ${contact.name}? Past alerts will still show their name.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeContact({ variables: { id: contact.id } });
            } catch (err: unknown) {
              Alert.alert(
                "Could not remove",
                err instanceof Error ? err.message : "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Contact }) => (
    <View style={styles.contactRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactEmail}>{item.email}</Text>
        {item.phone ? <Text style={styles.contactPhone}>{item.phone}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => confirmRemove(item)} style={styles.remove}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Trusted contacts</Text>
            <Text style={styles.subtitle}>
              Up to {MAX_CONTACTS}. These people get your alert.
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Jane Doe"
                placeholderTextColor={colors.muted}
                editable={!atLimit && !adding}
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="jane@example.com"
                placeholderTextColor={colors.muted}
                editable={!atLimit && !adding}
              />
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91…"
                placeholderTextColor={colors.muted}
                editable={!atLimit && !adding}
              />

              {formError && <Text style={styles.error}>{formError}</Text>}

              <TouchableOpacity
                style={[styles.addButton, (atLimit || adding) && styles.buttonDisabled]}
                onPress={submit}
                disabled={atLimit || adding}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>
                    {atLimit ? "Limit reached" : "Add contact"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.listTitle}>Your contacts ({contacts.length}/{MAX_CONTACTS})</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.error}>Could not load contacts.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.empty}>No contacts yet.</Text>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  error: { color: colors.danger, marginTop: spacing.sm, fontSize: 13 },
  addButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  contactName: { fontSize: 16, fontWeight: "600", color: colors.text },
  contactEmail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  contactPhone: { fontSize: 13, color: colors.muted },
  remove: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: "700" },
  empty: {
    textAlign: "center",
    color: colors.muted,
    marginTop: spacing.lg,
    fontSize: 14,
  },
  emptyBox: { alignItems: "center", marginTop: spacing.lg },
  retry: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
