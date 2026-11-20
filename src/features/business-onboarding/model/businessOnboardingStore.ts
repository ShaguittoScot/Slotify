import { create } from 'zustand';
import { storage } from '@/shared/lib/storage';
import { STORAGE_KEYS } from '@/shared/lib/constants';
import type { AuthUser } from '@/shared/types';
import { authApi } from '@/features/auth/api';
import { businessOnboardingApi } from '../api';
import type {
  CompleteBusinessOnboardingRequest,
  OnboardingBusinessHourDto,
  OnboardingServiceDto,
  SyncProfileRequest,
} from '../types';

export const parseTimeTo24Hours = (timeStr: string, fallback: string = '09:00:00'): string => {
  const trimmed = (timeStr || '').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }
  return fallback;
};

/**
 * Formatea un horario a formato 'HH:mm' de 24 horas requerido por el backend (TimeOnly).
 * Ejemplo: '09:00 AM' -> '09:00', '06:00 PM' -> '18:00', '14:30:00' -> '14:30'.
 */
export const formatTimeToHHmm = (timeStr: string, fallback: string = '09:00'): string => {
  const trimmed = (timeStr || '').trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.substring(0, 5);
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  return fallback;
};

/**
 * Normaliza las respuestas de error del endpoint de onboarding manteniendo el contexto funcional:
 * - 400: Errores de validación de campos.
 * - 401: Sesión no autenticada o token rechazado.
 * - 403: Usuario sin autorización o claims inconsistentes.
 * - 404: Usuario o negocio no encontrado.
 * - 409: Conflicto de slug.
 * - 5xx: Fallo en el servidor.
 */
export const getOnboardingErrorMessage = (err: any): string => {
  if (!err) {
    return 'Ocurrió un error inesperado al completar el onboarding.';
  }

  const status = err.response?.status;
  const data = err.response?.data;

  // HTTP 400: Errores de validación
  if (status === 400) {
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join('. ');
    }
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return 'Por favor verifica los datos ingresados en el formulario.';
  }

  // HTTP 401: Sesión no autenticada o token rechazado
  if (status === 401) {
    return (
      data?.message ||
      data?.error ||
      'Sesión no autenticada o token rechazado. Por favor, verifica tu sesión para continuar.'
    );
  }

  // HTTP 403: Usuario sin autorización o claims inconsistentes
  if (status === 403) {
    return (
      data?.message ||
      data?.error ||
      'Acceso no autorizado: la sesión no cuenta con los permisos requeridos o los identificadores del negocio no coinciden.'
    );
  }

  // HTTP 404: Usuario o negocio no encontrado
  if (status === 404) {
    return (
      data?.message ||
      data?.error ||
      'No se encontró el registro del usuario o del negocio en el servidor.'
    );
  }

  // HTTP 409: Conflicto de slug o discrepancia de identidad
  if (status === 409) {
    return (
      data?.error ||
      (Array.isArray(data?.errors) && data.errors[0]) ||
      data?.message ||
      'El nombre del negocio genera un enlace (slug) que ya está en uso. Por favor, elige otro nombre.'
    );
  }

  // HTTP 5xx: Fallo del servidor
  if (status && status >= 500) {
    return 'Ocurrió un inconveniente temporal en el servidor. Tus datos no se han perdido, por favor reintenta.';
  }

  // Errores locales con mensaje explícito (ej. lanzados por validaciones o exchangeToken)
  if (err.message && !err.response && !err.message.includes('Network Error')) {
    return err.message;
  }

  // Errores de red / timeout
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo nuevamente.';
  }
  if (err.message?.includes('Network Error') || !err.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo nuevamente.';
  }

  return (
    data?.message ||
    (Array.isArray(data?.errors) && data.errors.join('. ')) ||
    data?.error ||
    err.message ||
    'Ocurrió un error inesperado al completar el onboarding.'
  );
};

const DAY_MAP: Record<string, number> = {
  D: 0, // Domingo
  L: 1, // Lunes
  M: 2, // Martes
  X: 3, // Miércoles
  J: 4, // Jueves
  V: 5, // Viernes
  S: 6, // Sábado
};

const getSystemTimeZone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === 'string' && tz.trim().length > 0) {
      return tz;
    }
  } catch {
    // Fallback
  }
  return 'America/Mexico_City';
};

interface BusinessOnboardingState {
  step: number;
  category: string;
  sectorTemplateId: number;
  businessName: string;
  businessPhone: string;
  slug: string;
  timeZone: string;
  selectedDays: string[];
  startTime: string;
  endTime: string;
  serviceName: string;
  serviceDuration: string;
  servicePrice: string;
  syncedBusinessId: string | null;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCategory: (name: string, templateId?: number) => void;
  setBusinessName: (name: string) => void;
  setBusinessPhone: (phone: string) => void;
  setTimeZone: (tz: string) => void;
  toggleDay: (day: string) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  setServiceName: (name: string) => void;
  setServiceDuration: (duration: string) => void;
  setServicePrice: (price: string) => void;
  clearError: () => void;
  reset: () => void;

  submitOnboarding: (
    currentUser: AuthUser | null,
    updateGlobalUser: (partial: Partial<AuthUser>) => void
  ) => Promise<void>;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const INITIAL_DAYS = ['L', 'M', 'X', 'J', 'V'];

export const useBusinessOnboardingStore = create<BusinessOnboardingState>((set, get) => ({
  step: 1,
  category: '',
  sectorTemplateId: 1,
  businessName: '',
  businessPhone: '',
  slug: '',
  timeZone: getSystemTimeZone(),
  selectedDays: INITIAL_DAYS,
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  serviceName: '',
  serviceDuration: '45',
  servicePrice: '300',
  syncedBusinessId: null,
  isLoading: false,
  error: null,
  isCompleted: false,

  setStep: (step) => set({ step, error: null }),
  nextStep: () => set((state) => ({ step: Math.min(5, state.step + 1), error: null })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1), error: null })),

  setCategory: (name, templateId = 1) =>
    set({ category: name, sectorTemplateId: templateId, error: null }),

  setBusinessName: (name) =>
    set({
      businessName: name,
      slug: generateSlug(name),
      error: null,
    }),

  setBusinessPhone: (phone) => set({ businessPhone: phone, error: null }),
  setTimeZone: (tz) => set({ timeZone: tz }),

  toggleDay: (day) =>
    set((state) => {
      const exists = state.selectedDays.includes(day);
      const newDays = exists
        ? state.selectedDays.filter((d) => d !== day)
        : [...state.selectedDays, day];
      return { selectedDays: newDays, error: null };
    }),

  setStartTime: (time) => set({ startTime: time }),
  setEndTime: (time) => set({ endTime: time }),
  setServiceName: (name) => set({ serviceName: name, error: null }),
  setServiceDuration: (duration) => set({ serviceDuration: duration, error: null }),
  setServicePrice: (price) => set({ servicePrice: price, error: null }),
  clearError: () => set({ error: null }),

  reset: () =>
    set({
      step: 1,
      category: '',
      sectorTemplateId: 1,
      businessName: '',
      businessPhone: '',
      slug: '',
      timeZone: getSystemTimeZone(),
      selectedDays: INITIAL_DAYS,
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      serviceName: '',
      serviceDuration: '45',
      servicePrice: '300',
      syncedBusinessId: null,
      isLoading: false,
      error: null,
      isCompleted: false,
    }),

  submitOnboarding: async (currentUser, updateGlobalUser) => {
    if (!currentUser) {
      const err = 'No se encontró un usuario autenticado para completar el onboarding.';
      set({ error: err });
      throw new Error(err);
    }

    const state = get();
    const cleanBusinessName = state.businessName.trim();
    if (!cleanBusinessName) {
      const err = 'El nombre del negocio es obligatorio.';
      set({ error: err });
      throw new Error(err);
    }

    if (cleanBusinessName.length > 150) {
      const err = 'El nombre del negocio no puede exceder 150 caracteres.';
      set({ error: err });
      throw new Error(err);
    }

    if (!state.sectorTemplateId || state.sectorTemplateId <= 0) {
      const err = 'Debe seleccionar un giro comercial válido.';
      set({ error: err });
      throw new Error(err);
    }

    if (state.selectedDays.length === 0) {
      const err = 'Debes configurar al menos un día laboral.';
      set({ error: err });
      throw new Error(err);
    }

    const startTimeFormatted = formatTimeToHHmm(state.startTime, '09:00');
    const endTimeFormatted = formatTimeToHHmm(state.endTime, '18:00');

    if (startTimeFormatted >= endTimeFormatted) {
      const err = 'La hora de cierre debe ser posterior a la hora de apertura.';
      set({ error: err });
      throw new Error(err);
    }

    const cleanServiceName = state.serviceName.trim() || 'Servicio General';
    const durationNum = parseInt(state.serviceDuration, 10) || 30;
    const priceNum = parseFloat(state.servicePrice) || 0;

    if (durationNum <= 0) {
      const err = 'La duración del servicio debe ser mayor a 0 minutos.';
      set({ error: err });
      throw new Error(err);
    }

    if (priceNum < 0) {
      const err = 'El precio del servicio no puede ser negativo.';
      set({ error: err });
      throw new Error(err);
    }

    if (priceNum > 99999999.99) {
      const err = 'El precio del servicio excede el máximo permitido.';
      set({ error: err });
      throw new Error(err);
    }

    set({ isLoading: true, error: null });

    try {
      let activeBusinessId = state.syncedBusinessId || currentUser.businessId || '';

      // ── PASO 1: Sincronización Inicial (/api/auth/sync) ──
      // Solo se ejecuta si aún no tenemos un businessId asociado (idempotencia ante reintentos).
      if (!activeBusinessId) {
        const syncPayload: SyncProfileRequest = {
          id: currentUser.id,
          firstName: currentUser.firstName || currentUser.fullName?.split(' ')[0] || 'Administrador',
          lastName: currentUser.lastName || currentUser.fullName?.split(' ').slice(1).join(' ') || '',
          fullName: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Administrador',
          email: currentUser.email,
          businessName: cleanBusinessName,
          businessPhone: state.businessPhone.trim() || undefined,
          sectorTemplateId: state.sectorTemplateId,
        };

        try {
          const syncRes = await businessOnboardingApi.syncInitialBusiness(syncPayload);
          if (syncRes.success && syncRes.data?.businessId) {
            activeBusinessId = syncRes.data.businessId;
            set({ syncedBusinessId: activeBusinessId });

            // FASE 1: Guardar inmediatamente el JWT interno emitido por el backend
            if (syncRes.data.accessToken) {
              await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, syncRes.data.accessToken);
            }
            if (syncRes.data.refreshToken) {
              await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, syncRes.data.refreshToken);
            }

            updateGlobalUser({
              businessId: activeBusinessId,
              businessName: cleanBusinessName,
            });
          } else if (!syncRes.success) {
            throw new Error(
              syncRes.message || syncRes.errors?.join(', ') || 'Error al registrar el negocio inicial.'
            );
          }
        } catch (syncErr: any) {
          // FASE 2: Normalización exhaustiva de errores de respuesta HTTP
          const errData = syncErr.response?.data;
          const errorMsg: string = (
            errData?.error ||
            errData?.errors?.[0] ||
            errData?.message ||
            syncErr.message ||
            ''
          ).trim();

          const isAlreadyRegistered =
            errorMsg.toLowerCase().includes('ya está registrado') ||
            errorMsg.toLowerCase().includes('already exists') ||
            errorMsg.toLowerCase().includes('ya existe');

          if (isAlreadyRegistered) {
            // El usuario ya existe en PostgreSQL. NO volvemos a intentar crearlo ni crear otro negocio.
            // Recuperamos de forma segura su identidad, negocio y JWT interno mediante exchangeToken:
            try {
              const exchangeRes = await authApi.exchangeToken({
                userId: currentUser.id,
                email: currentUser.email,
              });

              if (exchangeRes.success && exchangeRes.data) {
                if (exchangeRes.data.accessToken) {
                  await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, exchangeRes.data.accessToken);
                }
                if (exchangeRes.data.refreshToken) {
                  await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, exchangeRes.data.refreshToken);
                }

                activeBusinessId = exchangeRes.data.user.businessId || '';
                set({ syncedBusinessId: activeBusinessId });

                updateGlobalUser({
                  businessId: activeBusinessId,
                  businessName: cleanBusinessName,
                  isOnboardingCompleted: Boolean(exchangeRes.data.user.isOnboardingCompleted),
                });

                // Si en backend el onboarding ya figuraba como completado, concluir directamente
                if (exchangeRes.data.user.isOnboardingCompleted) {
                  await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
                  const confirmedUser: AuthUser = {
                    ...currentUser,
                    businessId: activeBusinessId,
                    businessName: cleanBusinessName,
                    isOnboardingCompleted: true,
                  };
                  await storage.set(STORAGE_KEYS.USER_DATA, confirmedUser);
                  updateGlobalUser(confirmedUser);

                  set({
                    isLoading: false,
                    error: null,
                    isCompleted: true,
                    step: 5,
                  });
                  return;
                }
              } else {
                throw new Error(exchangeRes.message || 'No se pudo recuperar la sesión del usuario existente.');
              }
            } catch (exchangeErr: any) {
              const exData = exchangeErr.response?.data;
              const exMsg: string =
                exData?.error ||
                exData?.errors?.[0] ||
                exData?.message ||
                exchangeErr.message ||
                'Error de sincronización con el usuario registrado.';
              set({ error: exMsg, isLoading: false });
              throw new Error(exMsg);
            }
          } else {
            // No es usuario registrado; es otro error de validación o del servidor
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
          }
        }
      }

      // ── PASO 2: Construcción de Horarios Comerciales (formato HH:mm) ──
      const businessHours: OnboardingBusinessHourDto[] = state.selectedDays.map((d) => ({
        dayOfWeek: DAY_MAP[d] ?? 1,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      }));

      // Ordenar por dayOfWeek para consistencia
      businessHours.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      // ── PASO 3: Construcción de Servicios Iniciales ──
      const services: OnboardingServiceDto[] = [
        {
          name: cleanServiceName,
          durationMinutes: durationNum,
          price: priceNum,
        },
      ];

      // ── PASO 4: Finalización del Onboarding Seguro (/api/onboarding/complete-business-onboarding) ──
      // NOTA CRÍTICA DE SEGURIDAD (Fase 11):
      // El payload NO incluye 'id' ni 'email'. El backend resuelve la identidad y tenencia
      // exclusivamente mediante los claims del JWT interno de Slotify autenticado.
      const firstName = (currentUser.firstName || currentUser.fullName?.split(' ')[0] || 'Administrador').trim();
      const lastName = (currentUser.lastName || currentUser.fullName?.split(' ').slice(1).join(' ') || '').trim();
      const fullName = currentUser.fullName || `${firstName} ${lastName}`.trim() || undefined;

      const completePayload: CompleteBusinessOnboardingRequest = {
        firstName,
        lastName,
        fullName,
        business: {
          name: cleanBusinessName,
          phone: state.businessPhone.trim() || null,
          sectorTemplateId: state.sectorTemplateId,
          timeZone: state.timeZone || 'America/Mexico_City',
        },
        businessHours,
        services,
      };

      const completeRes = await businessOnboardingApi.completeBusinessOnboarding(completePayload);

      if (!completeRes.success) {
        throw new Error(
          completeRes.message ||
            completeRes.errors?.join('. ') ||
            completeRes.error ||
            'No se pudo confirmar la finalización del onboarding en el servidor.'
        );
      }

      const confirmedBusinessId = completeRes.data?.businessId || activeBusinessId;

      if (completeRes.data?.accessToken) {
        await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, completeRes.data.accessToken);
      }
      if (completeRes.data?.refreshToken) {
        await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, completeRes.data.refreshToken);
      }

      // ── PASO 5: Actualización del Contexto Global y Persistencia ──
      await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      const updatedUser: AuthUser = {
        ...currentUser,
        businessId: confirmedBusinessId,
        businessName: cleanBusinessName,
        firstName: completeRes.data?.firstName || firstName,
        lastName: completeRes.data?.lastName || lastName,
        fullName: completeRes.data?.fullName || fullName || `${firstName} ${lastName}`.trim(),
        isOnboardingCompleted: true,
      };
      await storage.set(STORAGE_KEYS.USER_DATA, updatedUser);

      updateGlobalUser(updatedUser);

      set({
        isLoading: false,
        error: null,
        isCompleted: true,
        step: 5, // Pantalla de éxito
      });
    } catch (err: any) {
      const errorMessage = getOnboardingErrorMessage(err);

      set({
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },
}));
