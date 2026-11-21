# 🔄 Flujo de Normalización de Errores y Feedback Visual

> [!abstract] Resumen del Flujo
> Describe el recorrido defensivo de control de errores desde que se produce una excepción en red, Axios o Supabase hasta que se traduce en un mensaje accesible en la interfaz móvil mediante `FormErrorBanner` y `FormFieldError`.

---

## ⚡ Ciclo de Vida del Error

```mermaid
flowchart TD
    A["Interacción de Usuario (Submit Form / Botón Guardar)"] --> B["Petición Asíncrona (apiClient / supabase)"]
    B --> C{"¿Respuesta Exitosa?"}
    
    C -->|Sí| D["Actualizar Estado Global y Limpiar Errores"]
    C -->|No| E["Excepción Capturada en Bloque catch (err)"]
    
    E --> F["Invocación a normalizeError(err, context)"]
    
    subgraph Normalizacion ["Módulo errorUtils.ts"]
        F --> G{"Identificar Origen del Fallo"}
        G -->|Sin Conexión / Timeout| H["category: 'NETWORK_ERROR'<br>Mensaje amigable de conectividad"]
        G -->|HTTP 400 ProblemDetails| I["category: 'VALIDATION'<br>Extraer fieldErrors mapeados a minúsculas"]
        G -->|HTTP 401 Credenciales| J["category: 'UNAUTHORIZED'<br>Contexto de formulario: no desloguear"]
        G -->|HTTP 409 Conflicto| K["category: 'CONFLICT'<br>Registro o email duplicado"]
        G -->|HTTP 500 Servidor| L["category: 'SERVER_ERROR'<br>Fallo interno del backend"]
    end

    Normalizacion --> M["Retornar Objeto NormalizedError"]
    M --> N["Guardar en Estado Local o Store (setFormError)"]
    
    subgraph FeedbackVisual ["Capa Visual (React Native)"]
        N --> O["<FormErrorBanner />: Banner superior con icono y título"]
        N --> P["<FormFieldError />: Mensaje debajo de inputs específicos"]
        N --> Q["Borde de Input en Rojo Semántico (#DC2626 / #F87171)"]
    end

    O --> R{"Acción de Recuperación"}
    R -->|Tocar Cerrar (X)| S["Limpiar errorState"]
    R -->|Tocar Reintentar| A
    R -->|Editar Campo Erróneo| T["Limpiar fieldErrors[campo] al cambiar texto"]
```

---

## 🛡️ Beneficios de la Arquitectura de Feedback

1. **Cero Fuga de Información Técnica:** Los usuarios finales nunca ven objetos `AxiosError`, *stack traces* ni cadenas en inglés no formateadas.
2. **Reintentabilidad Directa:** La acción de reintento en el banner ejecuta nuevamente la función que originó la falla sin obligar al usuario a recargar la pantalla.
3. **Limpieza Progresiva:** Al momento en que el usuario comienza a teclear en el campo señalado en rojo, el error específico de ese input se desvanece de inmediato.

---

## 🔗 Referencias Relacionadas
- Normalizador Técnico: [[Gestion Centralizada de Errores (errorUtils)]]
- Componentes UI: [[FormErrorBanner y FormFieldError]]
- Autenticación: [[Feature Auth (UI)]]
- MOC Principal: [[Indice General]]
