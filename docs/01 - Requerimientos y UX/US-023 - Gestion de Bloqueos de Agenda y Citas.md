# 🚫 US-023 - Gestión de Bloqueos de Agenda y Citas

> [!abstract] Descripción de la Historia
> **Como** administrador o profesional de un negocio,
> **quiero** bloquear franjas horarias específicas o días completos en mi calendario,
> **para** evitar que el sistema permita citas durante horarios de almuerzo, vacaciones, descansos o mantenimiento.

---

## 🎯 Criterios de Aceptación (Gherkin)

### Escenario 1: Bloqueo de franja horaria puntual
- **Dado** que el profesional visualiza su agenda del día en `CalendarView`,
- **Cuando** abre `BlockSlotModal` e ingresa *"Almuerzo"* de `14:00` a `15:00`,
- **Y** presiona *"Guardar Bloqueo"*,
- **Entonces** el sistema envía `POST /api/schedule-blocks`, deshabilita esos turnos para reservas públicas y muestra la franja sombreada con la leyenda de bloqueo en la agenda administrativa.

### Escenario 2: Validación de rango de tiempo inconsistente
- **Dado** que el usuario ingresa una hora de fin anterior o igual a la hora de inicio (ej. Inicio: `15:00`, Fin: `14:30`),
- **Cuando** intenta guardar,
- **Entonces** la interfaz impide la llamada a la API y muestra una alerta visual con `FormErrorBanner` indicando que la hora final debe ser posterior.

### Escenario 3: Eliminación o liberación de un bloqueo
- **Dado** que un bloqueo existente se cancela anticipadamente,
- **Cuando** el administrador toca el bloque y confirma *"Eliminar Bloqueo"*,
- **Entonces** se ejecuta `DELETE /api/schedule-blocks/:id` y los slots vuelven a mostrarse disponibles para agendar.

---

## 🖥️ Componentes y Pantallas Asociadas
- `BlockSlotModal.tsx` — Modal de creación y parametrización de bloqueos.
- `useScheduleBlockStore` — Estado reactivo del formulario de bloqueo.
- `CalendarView.tsx` — Visualización reactiva en agenda.

---

## 🔗 Referencias Relacionadas
- Feature de Bloqueos: [[Feature Schedule Blocks]]
- Calendario: [[Feature Calendar & Booking]]
- MOC Principal: [[Indice General]]
