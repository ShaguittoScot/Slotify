# 🏪 Feature Business Detail & Adaptive Brand (Experiencia Pública e Identidad Visual)

> [!abstract] Resumen del Módulo
> Implementa la experiencia pública de descubrimiento, presentación comercial del negocio y resolución adaptativa de identidad visual por sector (`Restaurante`, `Barbería & Estética`, `Salud & Clínica` y `General`), manteniendo compatibilidad total con los temas globales **Slotify** y **Obsidian** (modos claro, oscuro y sistema).

---

## 🔗 Trazabilidad de Historias de Usuario

- **[[US-023 - Detalle Publico de Negocios por Slug]] (Backend):** Consumo del perfil público comercial (`GET /api/businesses/{slug}`) y listado público (`GET /api/businesses`).
- **[[US-006 - Selector de Giro y Plantillas de Sector]]:** Adaptación visual y jerarquía de módulos según el giro comercial (`sectorTemplateId` / `categoryKey` / `category`).
- **[[US-020 - Creador Dinamico de Formularios (Form Builder)]]:** Herencia de identidad visual (`primaryColor`, `secondaryColor`, `logoUrl`, `presentationStyle`) en el flujo de reservas (`BookingScreen`).

---

## 🎯 Objetivo

Permitir que el cliente final explore establecimientos, consulte su página comercial adaptada al sector del negocio y realice una reserva dentro de una interfaz coherente, legible y accesible, donde la marca del establecimiento sea reconocible sin saturar ni romper la estética base de Slotify/Obsidian.

---

## ✅ Criterios de Aceptación y Estado Real

| Criterio | Estado Real | Observaciones |
|---|---|---|
| Explorar negocios con tarjetas limpias e identidad de marca (`BusinessCard`) | ✅ Implementado | Usa `useBusinessBrand(business)` con contraste WCAG en el CTA. |
| Página pública del negocio (`BusinessDetailScreen`) con portada, presentación, servicios, staff, galería y ubicación/horarios | ⚠️ Implementación parcial (dependiente de datos API) | Los componentes modulares están implementados y probados; `description`, `address`, `staff`, `gallery`, `coverImageUrl`, `rating` y `reviewCount` usan fallback cuando el backend aún no los expone en `BusinessDetailDto`. |
| Sistema de identidad visual en 3 capas (`Slotify Theme` → `Preset Sector` → `Personalización del Negocio`) | ✅ Implementado | Centralizado en `src/features/business-brand/` sin duplicación en pantallas. |
| Validación hex y contraste accesible WCAG (`#FFFFFF` vs `#111827`) | ✅ Implementado | Probado con luminancia relativa en `colorUtils.ts`. |
| Compatibilidad con temas **Slotify** y **Obsidian** (claro/oscuro/sistema) | ✅ Implementado | Integrado en `colors.ts`, `useTheme.ts`, `ThemeSettingsModal.tsx` y `SettingsScreen.tsx`. |
| No inventar fotografías ni logotipos cuando no existen en backend | ✅ Implementado | `resolveBusinessBrand` retorna `logoUrl: null` y `coverImageUrl: null` si no provienen de datos reales. |

---

## 📁 Arquitectura, Componentes y Archivos Clave

### 1. Módulo `src/features/business-brand/`
- `types/index.ts` — Tipos `BusinessSectorKey`, `SectorVisualPreset`, `BusinessBrandInput`, `ResolvedBusinessBrand`.
- `model/colorUtils.ts` — `isValidHexColor`, `normalizeHexColor`, `withAlpha`, `getRelativeLuminance`, `getContrastRatio`, `getAccessibleContrastText`.
- `model/sectorPresets.ts` — `SECTOR_VISUAL_PRESETS` (`restaurant`, `barbershop_beauty`, `health_clinic`, `general`) y `resolveSectorKey`.
- `model/resolveBusinessBrand.ts` — `resolveBusinessBrand` y hook `useBusinessBrand`.
- `__tests__/businessBrand.test.ts` — Suite unitaria de validación, contraste, presets y prioridad de 3 capas.

### 2. Integración en Experiencia del Cliente
- **Explorar:** `src/features/explore/model/index.ts`, `src/features/explore/ui/components/BusinessCard.tsx`, `src/features/explore/ui/styles/businessCard.styles.ts`.
- **Detalle Público:** `src/features/business-detail/model/index.ts`, `src/features/business-detail/model/sector.ts`, `src/features/business-detail/ui/screens/BusinessDetailScreen.tsx`, y secciones modulares (`BusinessCoverHero`, `BusinessAboutSection`, `BusinessServicesSection`, `BusinessStaffSection`, `BusinessGallerySection`, `BusinessLocationHoursSection`, `BusinessBookingBottomBar`).
- **Reservas:** `src/features/booking/ui/screens/BookingScreen.tsx` (integración de `resolveBusinessBrand` en `buildClientFormSchema` y `effectiveFormSchema`).
- **Sistema de Temas:** `src/shared/theme/colors.ts`, `src/shared/theme/useTheme.ts`, `src/shared/theme/ThemeSettingsModal.tsx`, `src/features/settings/ui/screens/SettingsScreen.tsx`, `src/components/FloatingTabBar.tsx`.

---

## ⏳ Datos Pendientes de Soporte en Backend

Los siguientes atributos ya están tipados en el frontend pero requieren exposición futura en `GET /api/businesses` / `GET /api/businesses/{slug}` (`BusinessDetailDto`):
- `coverImageUrl` (portada del establecimiento).
- `secondaryColor` y `presentationStyle` en el catálogo general (actualmente solo presentes en `GET /api/public/businesses/{slug}` dentro de `formConfig`).
- `gallery` (tabla/recurso de fotografías del negocio).
- `staff` con nombre y avatar propios en la ficha pública.
- `rating` y `reviewCount`.

---

## 🧪 Pruebas Ejecutadas

- **Jest (`node ./node_modules/jest/bin/jest.js --runInBand`):**
  - `21 passed, 21 total` suites (`138 passed, 138 total` pruebas), incluyendo `src/features/business-brand/__tests__/businessBrand.test.ts`, `src/features/business-detail/__tests__/businessDetail.test.ts`, `__tests__/exploreFilter.test.ts` y `__tests__/FormBranding.test.ts`.
- **TypeScript (`tsc --noEmit`):**
  - `0` errores en todos los archivos nuevos y modificados de `business-brand`, `business-detail`, `explore` y `booking`.
