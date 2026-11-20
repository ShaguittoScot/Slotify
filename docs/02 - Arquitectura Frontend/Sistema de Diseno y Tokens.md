# 🎨 Sistema de Diseño y Tokens Semánticos

> [!abstract] Resumen del Sistema de Diseño
> El sistema de diseño de **Slotify** se fundamenta en una paleta neutra **Dark Charcoal / Carbono Puro** (sin tintes azulados espurios en modo oscuro), soporte bimodal completo (*Light* y *Dark*), tipografía legible (**Inter** para lectura y datos, **Poppins** para encabezados), y un patrón de **estilos desacoplados** en archivos `*.styles.ts` parametrizados por `ThemeColors`.

---

## 🎨 Paleta Base y Tokens Semánticos

Los tokens están centralizados en `src/shared/theme/colors.ts` y se consumen mediante el hook `useAppTheme()`:

```typescript
// src/shared/theme/colors.ts
export const palette = {
  // Pure Neutral Dark Grays / True Charcoal (R ≈ G ≈ B)
  neutral: {
    50: '#F9F9F9',
    100: '#F2F2F2',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#3A3A3A',
    800: '#262626',
    850: '#1E1E1E',
    900: '#171717',
    950: '#121212',
  },
  // Primary Accent (Indigo)
  primary: {
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  // Semántica
  success: { main: '#10B981', light: '#DEF7EC' },
  warning: { main: '#F59E0B', light: '#FEF3C7' },
  error:   { main: '#EF4444', light: '#FEE2E2', darkBg: '#2D1214', darkBorder: '#7F1D1D' },
  info:    { main: '#3B82F6', light: '#E0F2FE' },
};
```

---

## 🌓 Mapeo de Tokens Semánticos: Claro vs Oscuro

| Token Semántico | Modo Claro (`lightColors`) | Modo Oscuro (`darkColors`) | Aplicación en UI |
| :--- | :--- | :--- | :--- |
| `background.primary` | `#F9F9F9` (Gris tenue) | `#121212` (Carbono mate puro) | Fondo principal de pantallas |
| `background.secondary` | `#FFFFFF` (Blanco puro) | `#1E1E1E` (Gris carbón) | Tarjetas, paneles y modales |
| `background.tertiary` | `#F2F2F2` (Gris claro) | `#262626` (Gris medio) | Inputs, chips y badges |
| `text.primary` | `#171717` (Negro neutro) | `#F9F9F9` (Blanco suave) | Títulos y etiquetas clave |
| `text.secondary` | `#525252` | `#D4D4D4` | Descripciones y subtítulos |
| `text.muted` | `#A3A3A3` | `#737373` | Placeholders y metadatos |
| `action.primary` | `#121212` | `#F9F9F9` | Botón principal de llamada a la acción |
| `border.main` | `#E5E5E5` | `#3A3A3A` | Bordes de inputs y divisores |
| `status.error` | `#DC2626` | `#F87171` | Banners y textos de error |

---

## 🔤 Tipografía y Jerarquía

Ubicada en `src/shared/theme/typography.ts`:
- **Familia Primaria (Texto y Números):** `Inter` (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`).
- **Familia Secundaria (Encabezados y Branding):** `Poppins` (`Poppins_500Medium`, `Poppins_600SemiBold`, `Poppins_700Bold`).
- **Escala de Tamaños:** `xs: 11`, `sm: 13`, `base: 15`, `lg: 17`, `xl: 20`, `2xl: 24`, `3xl: 30`.

---

## 📐 Patrón de Estilos Desacoplados (`*.styles.ts`)

Para evitar recalcular hojas de estilo dentro de los componentes en cada render, las features (como `src/features/explore/ui/styles/`) desacoplan sus estilos en funciones puras:

```typescript
// Ejemplo: src/features/explore/ui/styles/exploreScreen.styles.ts
import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export const createExploreScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
  });
```

En la vista correspondiente (`ExploreScreen.tsx`):
```tsx
const { colors } = useAppTheme();
const styles = useMemo(() => createExploreScreenStyles(colors), [colors]);
```

---

## 🔗 Referencias Relacionadas
- Primitivas UI: [[Primitivas UI y Microinteracciones]]
- Componentes de Error: [[FormErrorBanner y FormFieldError]]
- Barra Flotante: [[FloatingTabBar]]
- MOC Principal: [[Indice General]]
