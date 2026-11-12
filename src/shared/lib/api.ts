/**
 * Slotify API Client
 * Centralized Axios instance configured for the .NET backend API.
 * Relacionado con: US-022 (Envía el JWT emitido por JwtService con claim businessId y maneja expiración 401).
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { useAuthStore } from '@/features/auth/model';
import { authApi } from '@/features/auth/api';
import { STORAGE_KEYS } from './constants';
import { storage } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5272/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isHandlingUnauthorized = false;
let pendingRenewal: { userId: string; token: Promise<string | null> } | undefined;

type SlotifyRequest = InternalAxiosRequestConfig & { slotifyUserId?: string; slotifyRetried?: boolean };

function renewBackendToken(userId: string): Promise<string | null> {
  if (pendingRenewal?.userId === userId) return pendingRenewal.token;
  const token = (async () => {
    const session = await authApi.getSession();
    if (session?.user.id !== userId) return null;
    const renewed = await authApi.exchangeBackendToken(session.access_token, userId);
    return renewed?.accessToken ?? null;
  })();
  pendingRenewal = { userId, token };
  const clear = () => {
    if (pendingRenewal?.token === token) pendingRenewal = undefined;
  };
  void token.then(clear, clear);
  return token;
}

// Request interceptor — adjunta el JWT emitido por JwtService (.NET Backend) que contiene el claim businessId
apiClient.interceptors.request.use(
  async (config: SlotifyRequest) => {
    config.slotifyUserId ??= useAuthStore.getState().user?.id;
    if (!config.headers.has('Authorization')) {
      const token = await storage.secureGet(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — maneja sesión expirada o inválida (401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const request = error.config as SlotifyRequest | undefined;
      const requestUrl = request?.url ?? '';
      const isAuthEndpoint = requestUrl.includes('/auth/');
      const user = useAuthStore.getState().user;
      if (request?.slotifyUserId !== user?.id || isAuthEndpoint) return Promise.reject(error);

      if (request && !request.slotifyRetried && user?.id && user.businessId) {
        request.slotifyRetried = true;
        try {
          const token = await renewBackendToken(user.id);
          if (useAuthStore.getState().user?.id !== user.id) return Promise.reject(error);
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
            return apiClient.request(request);
          }
        } catch (renewError) {
          if (!axios.isAxiosError(renewError) || renewError.response?.status !== 401) {
            return Promise.reject(renewError);
          }
        }
      }

      if (!isHandlingUnauthorized && useAuthStore.getState().user?.id === user?.id) {
        isHandlingUnauthorized = true;
        try {
          await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
          await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
          await useAuthStore.getState().logout();
          router.replace('/(auth)' as any);
        } finally {
          isHandlingUnauthorized = false;
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
