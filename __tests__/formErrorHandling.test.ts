jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { normalizeError } from '../src/shared/lib/errorUtils';
import { useAuthStore } from '../src/features/auth/model';

describe('Gestión de Errores en Formularios — Slotify', () => {
  beforeEach(() => {
    useAuthStore.getState().clearError();
  });

  // ─── 1. Campo obligatorio vacío y validaciones locales ───
  describe('1. Validación de campos obligatorios y formatos', () => {
    it('detecta errores de validación de backend HTTP 400 con diccionario de campos', () => {
      const axios400Error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            title: 'One or more validation errors occurred.',
            errors: {
              Email: ['El formato del correo electrónico no es válido.'],
              Password: ['La contraseña debe contener al menos 6 caracteres.'],
            },
          },
        },
      };

      const normalized = normalizeError(axios400Error);

      expect(normalized.category).toBe('VALIDATION');
      expect(normalized.status).toBe(400);
      expect(normalized.title).toBe('Verifica los datos ingresados');
      expect(normalized.fieldErrors).toBeDefined();
      expect(normalized.fieldErrors?.email).toBe('El formato del correo electrónico no es válido.');
      expect(normalized.fieldErrors?.password).toBe('La contraseña debe contener al menos 6 caracteres.');
    });

    it('extrae array simple de errores devueltos por el backend en HTTP 400', () => {
      const arrayError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: ['El nombre del negocio es obligatorio', 'Debes seleccionar al menos un día laboral'],
          },
        },
      };

      const normalized = normalizeError(arrayError);
      expect(normalized.category).toBe('VALIDATION');
      expect(normalized.message).toContain('El nombre del negocio es obligatorio');
    });
  });

  // ─── 2. Simular respuesta HTTP 400 ───
  describe('2. Respuesta HTTP 400 del servidor', () => {
    it('muestra el mensaje del backend sin exponer detalles técnicos', () => {
      const http400 = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: 'El número de teléfono ya está en uso por otro cliente.',
          },
        },
      };

      const normalized = normalizeError(http400);
      expect(normalized.category).toBe('VALIDATION');
      expect(normalized.message).toBe('El número de teléfono ya está en uso por otro cliente.');
      expect(normalized.status).toBe(400);
    });
  });

  // ─── 3. Simular respuesta HTTP 500 ───
  describe('3. Respuesta HTTP 500 del servidor', () => {
    it('muestra un mensaje genérico amigable para reintentar sin trazas técnicas, SQL ni excepciones', () => {
      const http500WithSqlTrace = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            message: 'Npgsql.PostgresException (0x80004005): 42601: syntax error at or near "SELECT"',
            stackTrace: 'at Npgsql.Internal.NpgsqlConnector.ReadMessage(...)',
          },
        },
      };

      const normalized = normalizeError(http500WithSqlTrace);

      expect(normalized.category).toBe('SERVER_ERROR');
      expect(normalized.status).toBe(500);
      expect(normalized.title).toBe('No se pudo guardar la información');
      expect(normalized.message).not.toContain('Npgsql');
      expect(normalized.message).not.toContain('syntax error');
      expect(normalized.message).toContain('Tus datos no se han perdido, por favor intenta guardar nuevamente.');
    });
  });

  // ─── 4. Desconectar el servidor durante el envío (Red y Timeout) ───
  describe('4. Errores de conexión y red', () => {
    it('detecta pérdida de conexión o servidor no disponible', () => {
      const networkError = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
        response: undefined,
      };

      const normalized = normalizeError(networkError);
      expect(normalized.category).toBe('NETWORK_ERROR');
      expect(normalized.title).toBe('Sin conexión con el servidor');
      expect(normalized.message).toContain('Revisa tu conexión a internet e inténtalo nuevamente.');
    });

    it('detecta tiempo de espera agotado (Timeout)', () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
        response: undefined,
      };

      const normalized = normalizeError(timeoutError);
      expect(normalized.category).toBe('NETWORK_ERROR');
      expect(normalized.title).toBe('Tiempo de espera agotado');
      expect(normalized.message).toContain('El servidor tardó demasiado en responder.');
    });
  });

  // ─── 5. Simular sesión expirada vs credenciales inválidas ───
  describe('5. Distinción entre sesión expirada y credenciales de formulario', () => {
    it('en un formulario de autenticación (login/registro), 401 NO marca sesión expirada', () => {
      const login401Error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      const normalized = normalizeError(login401Error, { isAuthForm: true });
      expect(normalized.category).toBe('UNAUTHORIZED');
      expect(normalized.isSessionExpired).toBe(false);
      expect(normalized.title).toBe('Credenciales inválidas');
      expect(normalized.message).toBe('El correo electrónico o la contraseña son incorrectos.');
    });

    it('en un endpoint protegido con sesión activa, 401 SÍ marca sesión expirada legítima', () => {
      const protected401Error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Token has expired' },
        },
      };

      const normalized = normalizeError(protected401Error, { isAuthForm: false });
      expect(normalized.category).toBe('UNAUTHORIZED');
      expect(normalized.isSessionExpired).toBe(true);
      expect(normalized.title).toBe('Sesión expirada');
      expect(normalized.message).toContain('inicia sesión nuevamente');
    });

    it('HTTP 403 muestra mensaje de permisos insuficientes sin marcar expiración de sesión', () => {
      const http403 = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };

      const normalized = normalizeError(http403);
      expect(normalized.category).toBe('FORBIDDEN');
      expect(normalized.status).toBe(403);
      expect(normalized.title).toBe('Acceso no permitido');
      expect(normalized.isSessionExpired).toBeUndefined();
    });
  });

  // ─── 6. Corregir un formulario después de un error y enviarlo exitosamente ───
  describe('6. Flujo de corrección y estados del formulario', () => {
    it('mantiene el estado del store y permite limpiar errores al corregir campos', () => {
      const store = useAuthStore.getState();

      // Estado inicial: sin errores
      expect(store.error).toBeNull();
      expect(store.formError).toBeNull();

      // Simular registro con error (ej. contraseña corta)
      const errorObj = normalizeError(new Error('Password should be at least 6 characters'));
      useAuthStore.setState({ error: errorObj.message, formError: errorObj });

      expect(useAuthStore.getState().error).toBe('La contraseña debe contener al menos 6 caracteres.');
      expect(useAuthStore.getState().formError?.category).toBe('VALIDATION');
      expect(useAuthStore.getState().formError?.fieldErrors?.password).toBe('Mínimo 6 caracteres.');

      // Usuario corrige el campo -> se llama clearError()
      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().formError).toBeNull();
    });

    it('isHydrating se mantiene en false después de la hidratación y no se activa en acciones de formulario', async () => {
      // Al inicio de sesión o acciones, isLoading se activa pero isHydrating NO debe activarse
      useAuthStore.setState({ isHydrating: false, isLoading: false });

      expect(useAuthStore.getState().isHydrating).toBe(false);

      // Iniciar sesión en modo demo
      await useAuthStore.getState().login({ email: 'demo@slotify.com', password: 'any' });

      // Verificar que el usuario quedó autenticado y isHydrating nunca se volvió true
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isHydrating).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
