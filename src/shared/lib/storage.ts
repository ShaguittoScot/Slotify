/**
 * Slotify Storage Helpers
 * Typed wrappers around AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Memoria en caché de respaldo para entornos donde AsyncStorage nativo no esté enlazado
const memoryStore = new Map<string, string>();

// Sanitizador de claves para SecureStore (solo permite caracteres alfanuméricos, '.', '-', '_')
const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9._-]/g, '_');

export const storage = {
  // ── Standard Storage con Fallback Seguro ─────────────────────────────
  get: async <T = string>(key: string): Promise<T | null> => {
    try {
      let raw: string | null = null;
      try {
        raw = await AsyncStorage.getItem(key);
      } catch {
        // Si el módulo nativo de AsyncStorage es nulo en Expo Go, recurrimos a SecureStore
        try {
          raw = await storage.secureGet(sanitizeKey(key));
        } catch {
          raw = null;
        }
      }

      if (raw === null) {
        raw = memoryStore.get(key) ?? null;
      }

      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return (memoryStore.get(key) as unknown as T) ?? null;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    memoryStore.set(key, stringified);

    try {
      await AsyncStorage.setItem(key, stringified);
    } catch {
      // Si el módulo nativo de AsyncStorage es nulo, guardamos en SecureStore
      try {
        await storage.secureSet(sanitizeKey(key), stringified);
      } catch {
        // Mantenido en memoria de respaldo
      }
    }
  },

  remove: async (key: string): Promise<void> => {
    memoryStore.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      try {
        await storage.secureRemove(sanitizeKey(key));
      } catch {
        // Mantenido en memoria
      }
    }
  },

  clear: async (): Promise<void> => {
    memoryStore.clear();
    try {
      await AsyncStorage.clear();
    } catch {
      // Memoria limpiada
    }
  },

  // ── Secure Storage (Expo SecureStore) ────────────────────────────────
  secureGet: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting from secure storage [${key}]:`, error);
      return null;
    }
  },

  secureSet: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error saving to secure storage [${key}]:`, error);
    }
  },

  secureRemove: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing from secure storage [${key}]:`, error);
    }
  }
};

