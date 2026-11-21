# ⚡ Supabase Auth Client

> [!abstract] Resumen de la Integración
> Configuración del cliente oficial `@supabase/supabase-js` optimizada para React Native (Expo SDK 57), con adaptador de almacenamiento seguro basado en `Expo SecureStore` (o `localStorage` en Web), auto-refresco de tokens y transporte WebSocket para tiempo real.

---

## 🔧 Archivo de Configuración (`src/shared/lib/supabase.ts`)

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { storage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn('[Supabase] Advertencia: Credenciales no configuradas en .env.');
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
      getItem: async (key: string) => await storage.secureGet(key),
      setItem: async (key: string, value: string) => await storage.secureSet(key, value),
      removeItem: async (key: string) => await storage.secureRemove(key),
    },
    autoRefreshToken: isConfigured,
    persistSession: isConfigured,
    detectSessionInUrl: false,
  },
  realtime: wsTransport ? { transport: wsTransport } : undefined,
});

export { isConfigured as isSupabaseConfigured };
```

---

## 🔒 Adaptador de Almacenamiento Criptográfico

El cliente delega el almacenamiento de la sesión en el módulo unificado `storage`:
1. **Entorno Nativo (Android/iOS):** Utiliza `expo-secure-store` con la política `AFTER_FIRST_UNLOCK`.
2. **Entorno Web:** Utiliza `window.localStorage`.
3. **Manejo de Bloqueos:** Si el dispositivo está bloqueado o el módulo no responde, no interrumpe la ejecución y retorna `null` de forma controlada.

---

## 🔗 Referencias Relacionadas
- Feature Autenticación: [[Feature Auth (UI)]]
- Almacenamiento Local: [[Offline Storage y Cache]]
- Store Global: [[Estado Global y Stores]]
- Flujo de Registro: [[Flujo de Registro y Sync con Supabase Auth]]
