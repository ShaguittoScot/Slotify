import { isAxiosError } from 'axios';
import { apiClient } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';
import type { AuthUser } from '@/shared/types';

export interface BusinessInfo {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  timeZone: string;
  sector?: string | null;
  hours: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export async function fetchOwnBusinessInfo(signal?: AbortSignal): Promise<BusinessInfo> {
  try {
    const { data } = await apiClient.get<{ data: BusinessInfo }>('/businesses/me/settings', { signal });
    if (!data?.data?.id || !Array.isArray(data.data.hours)) {
      throw new Error('El servidor no devolvió la información del negocio.');
    }
    return data.data;
  } catch (failure) {
    if (isAxiosError<{ error?: string }>(failure) &&
        failure.response?.status === 404 && !failure.response.data?.error) {
      throw new Error('La API de Slotify necesita actualizarse para consultar la información del negocio.');
    }
    throw failure;
  }
}

export async function saveOwnProfile(
  user: AuthUser, firstName: string, lastName: string, businessName?: string,
): Promise<Partial<AuthUser>> {
  if (user.businessId?.startsWith('demo')) throw new Error('El perfil de prueba no se puede guardar.');
  if (user.businessId) {
    const { data } = await apiClient.patch<{ data: AuthUser }>('/profile', { firstName, lastName, businessName });
    const saved = data.data;
    if (saved?.id !== user.id || saved.businessId !== user.businessId) {
      throw new Error('El servidor no confirmó el perfil.');
    }
    return {
      firstName: saved.firstName, lastName: saved.lastName, fullName: saved.fullName,
      businessName: saved.businessName,
    };
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (user.role !== 'CLIENTE' || session?.user.id !== user.id) throw new Error('Vuelve a iniciar sesión.');
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const { error } = await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName, full_name: fullName },
  });
  if (error) throw error;
  return { firstName, lastName, fullName };
}

export function bookingLink(slug?: string): string | undefined {
  const configured = process.env.EXPO_PUBLIC_BOOKING_BASE_URL?.trim();
  if (!slug || !configured) return undefined;
  try {
    const base = new URL(configured);
    if (base.protocol === 'https:' && !base.search && !base.hash) {
      return `${base.href.replace(/\/$/, '')}/book/${encodeURIComponent(slug)}`;
    }
  } catch {
    // El portal se publica por separado.
  }
}
