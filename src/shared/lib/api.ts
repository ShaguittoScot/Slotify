/**
 * Slotify API Client
 * Centralized Axios instance configured for the .NET backend API.
 * Relacionado con: US-022 (Envía el JWT emitido por JwtService con claim businessId y maneja expiración 401).
 */

import axios from 'axios';
import { router } from 'expo-router';
import { useAuthStore } from '@/features/auth/model';
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

// Request interceptor — adjunta el JWT emitido por JwtService (.NET Backend) que contiene el claim businessId
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.secureGet(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      const requestUrl = error.config?.url ?? '';
      const isAuthEndpoint = requestUrl.includes('/auth/');

      if (!isAuthEndpoint && !isHandlingUnauthorized) {
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
