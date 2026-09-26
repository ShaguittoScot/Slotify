/**
 * Supabase Client
 * Configured with custom storage adapter for React Native (SecureStore on native, localStorage on web)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { storage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('[Supabase] Configured Supabase URL:', supabaseUrl);

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn('[Supabase] Advertencia: Credenciales de Supabase no configuradas en el archivo .env.');
}

const activeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const activeAnonKey = supabaseAnonKey || 'placeholder-anon-key';

let wsTransport: any = undefined;
if (typeof globalThis !== 'undefined' && (globalThis as any).WebSocket) {
  wsTransport = (globalThis as any).WebSocket;
} else {
  try {
    wsTransport = require('ws');
  } catch (e) {}
}

export const supabase: SupabaseClient = createClient(activeUrl, activeAnonKey, {
  auth: {
    storage: {
      getItem: async (key: string) => {
        return await storage.secureGet(key);
      },
      setItem: async (key: string, value: string) => {
        await storage.secureSet(key, value);
      },
      removeItem: async (key: string) => {
        await storage.secureRemove(key);
      },
    },
    autoRefreshToken: isConfigured,
    persistSession: isConfigured,
    detectSessionInUrl: false,
  },
  realtime: wsTransport ? { transport: wsTransport } : undefined,
});

export { isConfigured as isSupabaseConfigured };
