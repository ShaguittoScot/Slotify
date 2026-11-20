/**
 * Slotify API Client
 * Centralized Axios instance configured for the .NET backend API.
 * Relacionado con: US-022 (Envía el JWT emitido por JwtService con claim businessId y maneja expiración 401).
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { supabase } from './supabase';
import { API_ENDPOINTS, STORAGE_KEYS } from './constants';
import { storage } from './storage';

function getAuthState() {
  try {
    return (require('@/features/auth/model') as typeof import('@/features/auth/model')).useAuthStore.getState();
  } catch {
    return { user: null, logout: async () => {} };
  }
}

const PRIVATE_HOST_REGEX =
  /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/i;

function getExpoDevHostIp(): string | null {
  try {
    const Constants = require('expo-constants')?.default as
      | {
          expoConfig?: { hostUri?: string };
          manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
        }
      | undefined;
    const rawHostUri =
      Constants?.expoConfig?.hostUri ??
      Constants?.manifest2?.extra?.expoGo?.debuggerHost;
    if (!rawHostUri) return null;
    const host = rawHostUri.split(':')[0]?.trim();
    if (
      !host ||
      !PRIVATE_HOST_REGEX.test(host) ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configured) {
    try {
      const parsed = new URL(configured);
      if (!PRIVATE_HOST_REGEX.test(parsed.hostname)) {
        return configured.replace(/\/+$/, '');
      }
      const expoLanIp = getExpoDevHostIp();
      if (expoLanIp) {
        const port = parsed.port || '5272';
        const path =
          parsed.pathname && parsed.pathname !== '/'
            ? parsed.pathname.replace(/\/+$/, '')
            : '/api';
        return `${parsed.protocol}//${expoLanIp}:${port}${path}`;
      }
      return configured.replace(/\/+$/, '');
    } catch {
      return configured;
    }
  }

  const expoLanIp = getExpoDevHostIp();
  if (expoLanIp) {
    return `http://${expoLanIp}:5272/api`;
  }

  return 'http://localhost:5272/api';
}

const API_BASE_URL = resolveApiBaseUrl();

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
    const { data: sessionData, error } = await supabase.auth.getSession();
    const session = error ? null : sessionData.session;
    if (!session || session.user.id !== userId) return null;

    const response = await apiClient.post<{
      data?: { accessToken?: string; refreshToken?: string; user?: { id?: string } };
    }>(
      API_ENDPOINTS.AUTH.LOGIN,
      { userId, email: session.user.email || '' },
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );
    const tokenData = response.data?.data;
    const latestSession = await supabase.auth.getSession();
    if (!tokenData?.accessToken || tokenData.user?.id !== userId || latestSession.data.session?.user.id !== userId) {
      return null;
    }

    await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
    if (tokenData.refreshToken) {
      await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
    }
    return tokenData.accessToken;
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
    config.slotifyUserId ??= getAuthState().user?.id;
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
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/sync');
      const user = getAuthState().user;
      if (request?.slotifyUserId !== user?.id || isAuthEndpoint) return Promise.reject(error);

      if (request && !request.slotifyRetried && user?.id && user.businessId) {
        request.slotifyRetried = true;
        try {
          const token = await renewBackendToken(user.id);
          if (getAuthState().user?.id !== user.id) return Promise.reject(error);
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

      if (!isHandlingUnauthorized && getAuthState().user?.id === user?.id) {
        isHandlingUnauthorized = true;
        try {
          await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
          await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
          await getAuthState().logout();
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
