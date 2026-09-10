/**
 * Slotify API Client
 * Centralized Axios instance configured for the backend API
 */

import axios from 'axios';
import { storage } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.secureGet('accessToken');
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
    // TODO: Implement refresh token logic here
    if (error.response?.status === 401) {
      await storage.secureRemove('accessToken');
      await storage.secureRemove('refreshToken');
      // TODO: Navigate to login screen or dispatch logout event
    }
    return Promise.reject(error);
  },
);

export default apiClient;
