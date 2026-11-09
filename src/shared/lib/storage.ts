
/**
 * Slotify Storage Helpers
 * AsyncStorage for general data, SecureStore for sensitive data
 * and memory as a last-resort fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

const sanitizeKey = (key: string) =>
  key.replace(/[^a-zA-Z0-9._-]/g, '_');

const parseValue = <T>(raw: string): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
};

export const storage = {
  get: async <T = string>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);

      if (raw !== null) {
        return parseValue<T>(raw);
      }
    } catch {
      // AsyncStorage unavailable: try SecureStore.
    }

    try {
      const secureValue = await storage.secureGet(sanitizeKey(key));

      if (secureValue !== null) {
        return parseValue<T>(secureValue);
      }
    } catch {
      // SecureStore unavailable: try memory.
    }

    const memoryValue = memoryStore.get(key);

    return memoryValue !== undefined
      ? parseValue<T>(memoryValue)
      : null;
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    const stringified =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (stringified === undefined) {
      throw new Error(`[Storage] Value for "${key}" cannot be serialized.`);
    }

    try {
      await AsyncStorage.setItem(key, stringified);
      memoryStore.set(key, stringified);
      return;
    } catch {
      // Try persistent secure storage.
    }

    try {
      await storage.secureSet(sanitizeKey(key), stringified);
      memoryStore.set(key, stringified);
      return;
    } catch {
      // Last resort: current-process memory only.
      memoryStore.set(key, stringified);
    }
  },

  remove: async (key: string): Promise<void> => {
    memoryStore.delete(key);

    const results = await Promise.allSettled([
      AsyncStorage.removeItem(key),
      storage.secureRemove(sanitizeKey(key)),
    ]);

    if (results.every((result) => result.status === 'rejected')) {
      throw new Error(`[Storage] Could not remove "${key}" from persistent storage.`);
    }
  },

  clear: async (): Promise<void> => {
    memoryStore.clear();
    await AsyncStorage.clear();
  },

  secureGet: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  },

  secureSet: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        throw new Error('[Storage] Browser storage is unavailable.');
      }

      window.localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  },

  secureRemove: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        throw new Error('[Storage] Browser storage is unavailable.');
      }

      window.localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};
