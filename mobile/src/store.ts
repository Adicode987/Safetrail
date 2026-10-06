import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "safetrail_token";
const NOTIFY_KEY = "safetrail_scheduled_notif";

type AuthState = {
  token: string | null;
  loading: boolean;
  restore: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  token: null,
  loading: true,
  restore: async () => {
    try {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY);
      set({ token: saved, loading: false });
    } catch {
      set({ token: null, loading: false });
    }
  },
  signIn: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(NOTIFY_KEY).catch(() => {});
    set({ token: null });
  },
}));

export async function rememberNotificationId(id: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(NOTIFY_KEY, id);
  } catch {}
}

export async function readNotificationId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(NOTIFY_KEY);
  } catch {
    return null;
  }
}

export async function forgetNotificationId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(NOTIFY_KEY);
  } catch {}
}
