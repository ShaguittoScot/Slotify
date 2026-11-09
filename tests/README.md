# Pruebas de selección de giro — Slotify

Las cinco pruebas de `SectorTemplateCard.test.tsx` importan directamente el
componente y el catálogo de `src/`; no usan una copia de la implementación.
Cada caso comenta las secciones ARRANGE, ACT y ASSERT.

## Ejecución

Desde la raíz del frontend, con sus dependencias instaladas (`npm install`):

```sh
npm run test:sector
npm test -- --runInBand
npm run test:coverage
```

El primer comando ejecuta los cinco casos de la actividad. El segundo también
incluye la prueba de ejemplo existente en `__tests__/Sample.test.ts`.
El tercero genera el informe HTML en `coverage/lcov-report/index.html`.
Los informes generados están excluidos de Git.

## Casos

| Caso | Comportamiento verificado |
| --- | --- |
| CP-01 | Nombre, descripción, accesibilidad y estado inicial habilitado sin selección. |
| CP-02 | Una pulsación entrega la categoría completa una sola vez; el padre controla la selección. |
| CP-03 | Una tarjeta deshabilitada bloquea la selección. |
| CP-04 | Un cambio de `isSelected` actualiza el estado accesible sin emitir una selección. |
| CP-05 | Al cambiar la categoría a modo libre, se muestran y entregan los nuevos datos. |

## Configuración y alcance

- Se usa `jest-expo` con el preset de React Native 0.86.3, compatible con Expo 57.
- React Native Testing Library 14 requiere esperar `render` y `rerender`;
  las pruebas también esperan las pulsaciones de `userEvent`.
- `tests/globals.d.ts` carga los tipos de Jest para la comprobación de TypeScript.
- `tests/setup.cjs` sustituye las animaciones de Reanimated por valores
  inmediatos y omite los símbolos nativos de Expo. Los componentes de React
  Native usan el entorno de pruebas de `jest-expo`.
- Los casos validan contenido, interacción y accesibilidad. No certifican
  apariencia, física de animaciones, FPS ni funcionamiento en un dispositivo.
- Estas pruebas no invocan la API ni escriben en la base de datos.

La documentación escolar de la actividad independiente conserva sus propios
resultados; esta integración permite ejecutar los casos con las dependencias
del proyecto original.

## Resultado verificado en el proyecto original

- Cinco casos de `SectorTemplateCard` aprobados.
- Suite completa: dos suites y seis pruebas aprobadas, incluida la de ejemplo.
- `tsc --noEmit` sin errores.
- Cobertura de `SectorTemplateCard`: 85.18 % de líneas, 86.66 % de sentencias,
  100 % de funciones y 69.81 % de ramas.
