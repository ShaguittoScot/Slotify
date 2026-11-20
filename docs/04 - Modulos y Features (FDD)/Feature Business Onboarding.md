# 🏢 Feature Business Onboarding (B2B Wizard)

> [!abstract] Resumen del Módulo
> `src/features/business-onboarding/` implementa el asistente de configuración guiada (Wizard de 5 pasos) para dueños de negocio (`DUENO`). Desacopla la creación del negocio de la autenticación básica, permitiendo registrar nombre comercial, giro, horarios laborales, servicios iniciales y generación automática de slug para reservas públicas.

---

## 📁 Estructura del Módulo

```
src/features/business-onboarding/
├── api/
│   ├── businessOnboardingApi.ts      # Llamadas a endpoints de onboarding y negocio
│   └── index.ts
├── model/
│   ├── businessOnboardingStore.ts    # useBusinessOnboardingStore (Zustand + Draft AsyncStorage)
│   └── index.ts
├── types/
│   ├── businessOnboarding.types.ts   # Tipos de cada paso del Wizard y DTOs
│   └── index.ts
├── ui/
│   ├── screens/
│   │   └── BusinessOnboardingWizardScreen.tsx # Pantalla principal del Wizard
│   └── index.ts
├── __tests__/
│   └── businessOnboarding.test.ts    # 7 pruebas unitarias del store y persistencia
└── index.ts
```

---

## 🪜 Los 5 Pasos del Asistente Comercial

```mermaid
graph LR
    Paso1["Paso 1:<br>Giro Comercial"] --> Paso2["Paso 2:<br>Datos del Negocio"]
    Paso2 --> Paso3["Paso 3:<br>Horarios Laborales"]
    Paso3 --> Paso4["Paso 4:<br>Servicio Inicial"]
    Paso4 --> Paso5["Paso 5:<br>Confirmación & Link"]
```

1. **Paso 1 — Giro Comercial:** Selección de la industria (`CANONICAL_SECTOR_CATEGORIES`: Belleza, Salud, Fitness, Servicios Profesionales, etc.). Sugiere automáticamente servicios base acordes al giro.
2. **Paso 2 — Identidad del Negocio:** Nombre comercial, teléfono de atención, zona horaria y generación reactiva de slug web (`slotify.app/book/mi-negocio`).
3. **Paso 3 — Horarios de Atención:** Selector de días laborales activos (Lunes a Domingo) y rango de horas (`09:00` a `18:00`).
4. **Paso 4 — Configuración de Servicio Inicial:** Nombre del servicio, duración estimada en minutos y precio sugerido.
5. **Paso 5 — Lanzamiento y Enlace Compartible:** Resumen final, invocación al endpoint `/onboarding/complete-business-onboarding`, opción nativa de compartir enlace y redirección a `(main)/index` con flag `STORAGE_KEYS.ONBOARDING_COMPLETE`.

---

## 💻 Integración del Store (`useBusinessOnboardingStore`)

```typescript
// Fragmento de src/features/business-onboarding/model/businessOnboardingStore.ts
export const useBusinessOnboardingStore = create<BusinessOnboardingState>((set, get) => ({
  step: 1,
  category: '',
  businessName: '',
  businessPhone: '',
  slug: '',
  selectedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  startTime: '09:00',
  endTime: '18:00',
  serviceName: '',
  serviceDuration: '45',
  servicePrice: '300',
  isLoading: false,
  error: null,

  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  submitCompleteOnboarding: async () => {
    // Valida y consolida la configuración con la API de Slotify
  },
}));
```

---

## 🧪 Pruebas Unitarias Asociadas

En `src/features/business-onboarding/__tests__/businessOnboarding.test.ts`:
- Validación de navegación secuencial (avance y retroceso de pasos).
- Cálculo automático de slug sanitizado a partir del nombre comercial.
- Persistencia y restauración del borrador en caso de reinicio de la aplicación.
- Rechazo defensivo y mensajes de error normalizados ante fallos de conexión.

---

## 🔗 Referencias Relacionadas
- Requerimiento de Registro: [[US-001 - Experiencia de Registro B2C y B2B]]
- Selector de Giro: [[Feature Sector Templates]]
- Cliente API: [[Slotify API Client]]
- MOC Principal: [[Indice General]]
