/**
 * Slotify API Client
 * Centralized Axios instance configured for the backend API
 */

import axios from 'axios';
import { storage } from './storage';
import { STORAGE_KEYS } from './constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5272/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Slotify internal JWT token exclusively
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

// Response interceptor — handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Distinguir entre un error de credenciales en formulario y una sesión expirada real.
    // Endpoints de autenticación y sincronización NO deben desautenticar la sesión global.
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/sync');

    if (status === 401 && !isAuthEndpoint) {
      // Solo si el endpoint protegido rechazó un token existente que ya expiró
      const hadAuthHeader = Boolean(error.config?.headers?.Authorization);
      if (hadAuthHeader) {
        await storage.secureRemove('accessToken');
        await storage.secureRemove('refreshToken');
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
