/**
 * Slotify Constants
 * Global constants used throughout the application
 */

export const APP_NAME = 'Slotify';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  THEME_MODE: 'themeMode',
  ONBOARDING_COMPLETE: 'onboardingComplete',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SYNC: '/auth/sync',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  /** US-006: Selector de Giro Comercial / US-002: Plantillas por Sector */
  SECTOR_TEMPLATES: {
    GET_ALL: '/sector-templates',
  },
  /** US-003: Calendario — obtener slots por rango de fechas */
  CALENDAR: {
    GET_SLOTS: '/calendar/slots',
  },
  /** US-008: Bloqueo Manual de Horarios */
  SCHEDULE_BLOCKS: {
    CREATE: '/schedule-blocks',
    DELETE: (id: number) => `/schedule-blocks/${id}`,
  },
} as const;

export const QUERY_KEYS = {
  CURRENT_USER: ['auth', 'currentUser'] as const,
  /** US-006 / US-002: Cache de plantillas de sector */
  SECTOR_TEMPLATES: ['sectorTemplates'] as const,
  /** US-003: Cache de slots del calendario, parametrizado por rango */
  CALENDAR_SLOTS: (startDate: string, endDate: string) =>
    ['calendar', 'slots', startDate, endDate] as const,
  /** US-008: Cache de bloqueos de agenda */
  SCHEDULE_BLOCKS: (startDate: string, endDate: string) =>
    ['scheduleBlocks', startDate, endDate] as const,
} as const;
