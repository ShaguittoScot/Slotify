/**
 * Supabase Client
 * Configured with custom storage adapter for React Native (SecureStore on native, localStorage on web)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { storage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Configured Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials not configured. Please check your .env file.');
}

const isConfigured = true;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
});

export { isConfigured as isSupabaseConfigured };
