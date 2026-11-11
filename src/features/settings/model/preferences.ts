import { Platform } from 'react-native';
import { create } from 'zustand';
import { storage } from '@/shared/lib/storage';

const storageKey = (scope: string) => `slotify_settings_${scope}`;
const defaults = { notifications: false, haptics: true };

interface PreferenceState {
  scope: string | undefined;
  ready: boolean;
  notifications: boolean;
  haptics: boolean;
  load: (scope?: string) => Promise<void>;
  update: (scope: string, patch: Partial<typeof defaults>) => Promise<void>;
}

export const useSettingsPreferences = create<PreferenceState>((set, get) => ({
  scope: undefined,
  ready: false,
  ...defaults,
  load: async (scope) => {
    set({ scope, ready: false, ...defaults });
    if (!scope) return;
    const saved = await storage.get<Partial<typeof defaults>>(storageKey(scope));
    if (get().scope === scope) {
      set({
        ready: true,
        notifications: saved?.notifications === true,
        haptics: saved?.haptics !== false,
      });
    }
  },
  update: async (scope, patch) => {
    const current = get();
    if (current.scope !== scope || !current.ready) return;
    const next = { notifications: current.notifications, haptics: current.haptics, ...patch };
    set(next);
    await storage.set(storageKey(scope), next);
  },
}));

export function settingsScope(user?: { id: string; businessId?: string } | null): string | undefined {
  return user ? `${user.id}_${user.businessId || 'consumer'}` : undefined;
}

export function appointmentHaptic(success = false) {
  const { haptics, ready } = useSettingsPreferences.getState();
  if (Platform.OS === 'web' || !ready || !haptics) return;
  void import('expo-haptics').then((device) => success
    ? device.notificationAsync(device.NotificationFeedbackType.Success)
    : device.selectionAsync()
  ).catch(() => {});
}
