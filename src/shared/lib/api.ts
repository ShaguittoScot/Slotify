/**
 * Slotify API Client
 * Centralized Axios instance configured for the .NET backend API.
 * Relacionado con: US-022 (Envía el JWT emitido por JwtService con claim businessId y maneja expiración 401).
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from './constants';
import { storage } from './storage';

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // En Android (emulador o dispositivo físico en red local), localhost apunta al teléfono
  if (Platform.OS === 'android') {
    const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5272/api`;
      }
    }
    // Fallback de loopback para Android Emulator
    return 'http://10.0.2.2:5272/api';
  }

  if (Platform.OS === 'ios') {
    const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5272/api`;
      }
    }
  }

  return envUrl ?? 'http://localhost:5272/api';
}

const API_BASE_URL = resolveBaseUrl();

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

// Lazy accessors para resolver dependencias circulares (auth/model -> auth/api -> shared/lib/api)
const getAuthStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuthStore } = require('@/features/auth/model');
  return useAuthStore;
};

const getAuthApi = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { authApi } = require('@/features/auth/api');
  return authApi;
};

function renewBackendToken(userId: string): Promise<string | null> {
  if (pendingRenewal?.userId === userId) return pendingRenewal.token;
  const token = (async () => {
    try {
      const authApi = getAuthApi();
      const session = await authApi.getSession();
      if (session?.user.id !== userId) return null;
      const renewed = await authApi.exchangeBackendToken(session.access_token, userId);
      return renewed?.accessToken ?? null;
    } catch {
      return null;
    }
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
    try {
      config.slotifyUserId ??= getAuthStore().getState().user?.id;
    } catch {
      // Ignorar si el store aún no inicializa
    }
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
      
      let user: any = null;
      try {
        user = getAuthStore().getState().user;
      } catch {}

      if (request?.slotifyUserId !== user?.id || isAuthEndpoint) return Promise.reject(error);

      if (request && !request.slotifyRetried && user?.id && user.businessId) {
        request.slotifyRetried = true;
        try {
          const token = await renewBackendToken(user.id);
          if (getAuthStore().getState().user?.id !== user.id) return Promise.reject(error);
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

      if (!isHandlingUnauthorized && getAuthStore().getState().user?.id === user?.id) {
        isHandlingUnauthorized = true;
        try {
          await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
          await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
          await getAuthStore().getState().logout();
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
