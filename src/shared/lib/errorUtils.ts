/**
 * Utilidades centralizadas para normalización y gestión de errores en Slotify.
 * Convierte errores de Axios, respuestas HTTP, Supabase Auth y excepciones de red
 * en estructuras estandarizadas y amigables para el usuario.
 */

export type ErrorCategory =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface NormalizedError {
  /** Título conciso del error */
  title: string;
  /** Mensaje principal claro y comprensible sin detalles técnicos */
  message: string;
  /** Categoría normalizada para lógica de presentación */
  category: ErrorCategory;
  /** Código de estado HTTP si aplica */
  status?: number;
  /** Errores asociados a campos específicos del formulario */
  fieldErrors?: Record<string, string>;
  /** Indica si la sesión realmente ha expirado (requiere reautenticación) */
  isSessionExpired?: boolean;
}

/**
 * Normaliza cualquier tipo de error (Axios, Supabase, red, excepciones genéricas)
 * a una estructura estandarizada segura y accesible.
 *
 * @param error El error capturado en el bloque catch
 * @param context Opciones adicionales como si la petición proviene de un formulario de login/registro
 */
export function normalizeError(
  error: any,
  context?: { isAuthForm?: boolean; resourceName?: string }
): NormalizedError {
  if (!error) {
    return {
      title: 'Error inesperado',
      message: 'Ocurrió un problema inesperado. Por favor inténtalo de nuevo.',
      category: 'UNKNOWN',
    };
  }

  // ── 1. Errores de Red y Conexión (Sin respuesta del servidor) ──
  const isNetworkError =
    error.isAxiosError &&
    (!error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout'));

  const isFetchNetworkError =
    error.name === 'TypeError' &&
    (error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch'));

  if (isNetworkError || isFetchNetworkError) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    return {
      title: isTimeout ? 'Tiempo de espera agotado' : 'Sin conexión con el servidor',
      message: isTimeout
        ? 'El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo nuevamente.'
        : 'No fue posible completar la operación. Revisa tu conexión a internet e inténtalo nuevamente.',
      category: 'NETWORK_ERROR',
      status: 0,
    };
  }

  // ── 2. Errores HTTP con Respuesta del Servidor (Axios / Fetch) ──
  const response = error.response;
  if (response && typeof response.status === 'number') {
    const status = response.status;
    const data = response.data;

    // HTTP 400: Validación o datos incorrectos
    if (status === 400) {
      const fieldErrors: Record<string, string> = {};
      let customMessage = 'Revisa los campos del formulario e inténtalo nuevamente.';

      if (data) {
        // Formato ASP.NET ProblemDetails / ModelState: { errors: { FieldName: ["msg"] } }
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          Object.entries(data.errors).forEach(([field, msgs]) => {
            const fieldKey = field.charAt(0).toLowerCase() + field.slice(1);
            if (Array.isArray(msgs) && msgs.length > 0) {
              fieldErrors[fieldKey] = msgs[0];
            } else if (typeof msgs === 'string') {
              fieldErrors[fieldKey] = msgs;
            }
          });
          const firstKey = Object.keys(fieldErrors)[0];
          if (firstKey) {
            customMessage = fieldErrors[firstKey];
          }
        } else if (Array.isArray(data.errors) && data.errors.length > 0) {
          customMessage = data.errors.join('. ');
        } else if (data.message && typeof data.message === 'string') {
          customMessage = sanitizeErrorMessage(data.message);
        } else if (data.title && typeof data.title === 'string') {
          customMessage = sanitizeErrorMessage(data.title);
        }
      }

      return {
        title: 'Verifica los datos ingresados',
        message: customMessage,
        category: 'VALIDATION',
        status: 400,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    }

    // HTTP 401: Autenticación / Credenciales
    if (status === 401) {
      if (context?.isAuthForm) {
        return {
          title: 'Credenciales inválidas',
          message: 'El correo electrónico o la contraseña son incorrectos.',
          category: 'UNAUTHORIZED',
          status: 401,
          isSessionExpired: false,
        };
      }

      return {
        title: 'Sesión expirada',
        message: 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar.',
        category: 'UNAUTHORIZED',
        status: 401,
        isSessionExpired: true,
      };
    }

    // HTTP 403: Permisos insuficientes (no debe redirigir automáticamente)
    if (status === 403) {
      const forbiddenMsg =
        data?.error ||
        (Array.isArray(data?.errors) && data.errors[0]) ||
        data?.message ||
        'No cuentas con los permisos necesarios para realizar esta acción.';
      return {
        title: 'Acceso no permitido',
        message: sanitizeErrorMessage(forbiddenMsg),
        category: 'FORBIDDEN',
        status: 403,
      };
    }

    // HTTP 404: Recurso no encontrado
    if (status === 404) {
      const resource = context?.resourceName ? ` de ${context.resourceName}` : '';
      return {
        title: 'No encontrado',
        message: `La información solicitada${resource} no está disponible o fue eliminada.`,
        category: 'NOT_FOUND',
        status: 404,
      };
    }

    // HTTP 409: Conflicto (duplicados, discrepancia de identidad, choque de citas)
    if (status === 409) {
      const conflictMsg =
        data?.error ||
        (Array.isArray(data?.errors) && data.errors[0]) ||
        data?.message ||
        data?.title ||
        'El registro o horario seleccionado ya está en uso.';
      return {
        title: 'Conflicto de información',
        message: sanitizeErrorMessage(conflictMsg),
        category: 'CONFLICT',
        status: 409,
      };
    }

    // HTTP 500 y otros 5xx: Error del Servidor
    if (status >= 500) {
      return {
        title: 'No se pudo guardar la información',
        message: 'Ocurrió un inconveniente temporal en el servidor. Tus datos no se han perdido, por favor intenta guardar nuevamente.',
        category: 'SERVER_ERROR',
        status,
      };
    }
  }

  // ── 3. Errores de Supabase Auth ──
  const errorMsg = typeof error === 'string' ? error : error.message || '';
  if (errorMsg) {
    const lower = errorMsg.toLowerCase();

    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return {
        title: 'Credenciales incorrectas',
        message: 'El correo o la contraseña que ingresaste no coinciden.',
        category: 'UNAUTHORIZED',
        status: 401,
        isSessionExpired: false,
      };
    }

    if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('email already in use')) {
      return {
        title: 'Correo ya registrado',
        message: 'Ya existe una cuenta con este correo electrónico. Inicia sesión o utiliza otro.',
        category: 'CONFLICT',
        status: 409,
        fieldErrors: { email: 'Este correo ya está registrado.' },
      };
    }

    if (lower.includes('password should be at least')) {
      return {
        title: 'Contraseña muy corta',
        message: 'La contraseña debe contener al menos 6 caracteres.',
        category: 'VALIDATION',
        fieldErrors: { password: 'Mínimo 6 caracteres.' },
      };
    }

    if (lower.includes('email not confirmed')) {
      return {
        title: 'Correo no confirmado',
        message: 'Revisa tu bandeja de entrada y confirma tu correo antes de iniciar sesión.',
        category: 'UNAUTHORIZED',
      };
    }

    if (lower.includes('network request failed')) {
      return {
        title: 'Error de conexión',
        message: 'No fue posible conectar con el servicio de autenticación. Verifica tu conexión a internet.',
        category: 'NETWORK_ERROR',
      };
    }

    return {
      title: 'Atención',
      message: sanitizeErrorMessage(errorMsg),
      category: 'UNKNOWN',
    };
  }

  return {
    title: 'No se pudo completar la operación',
    message: 'Ocurrió un error inesperado al procesar la solicitud. Intenta nuevamente.',
    category: 'UNKNOWN',
  };
}

/**
 * Limpia mensajes técnicos que puedan contener referencias a SQL, trazas o excepciones internas.
 */
function sanitizeErrorMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return 'Ocurrió un error inesperado.';

  const lower = msg.toLowerCase();
  if (
    lower.includes('sql') ||
    lower.includes('exception') ||
    lower.includes('stacktrace') ||
    lower.includes('syntax error') ||
    lower.includes('nullreference') ||
    lower.includes('entityframework') ||
    lower.includes('npgsql')
  ) {
    return 'Ocurrió un error al procesar los datos. Por favor inténtalo nuevamente.';
  }

  return msg;
}
