# 💈 US-006 - Selector de Giro y Plantillas de Sector

> [!abstract] Descripción de la Historia
> **Como** dueño de un negocio recién incorporado a Slotify,
> **quiero** seleccionar el giro comercial de mi establecimiento (barbería, estética, consultorio, restaurante, etc.),
> **para** que el sistema adapte automáticamente los módulos activos, la duración de turnos y los campos del formulario de reserva a las necesidades de mi industria.

---

## 🎯 Criterios de Aceptación (Gherkin)

### Escenario 1: Selección de plantilla de Barbería (US-002 / SCRUM-105)
- **Dado** que un administrador se encuentra en el configurador de giro (`SectorSelectionScreen`),
- **Cuando** selecciona la tarjeta *"Barbería & Peluquería"*,
- **Entonces** el sistema precarga turnos estándar de 30 minutos, activa el módulo de asignación de barberos/estilistas y sugiere servicios base como "Corte Clásico" y "Afeitado con Toalla Caliente".

### Escenario 2: Activación y desactivación modular
- **Dado** que el negocio pertenece al giro de estética pero no requiere cobro de anticipos en línea,
- **Cuando** el usuario desmarca el módulo *"Anticipos y Pagos Online"*,
- **Entonces** el sistema actualiza `selectedModules` en `useSectorTemplateStore` y oculta las opciones de pasarela de pago en el flujo de reserva.

### Escenario 3: Persistencia de la configuración
- **Dado** que el usuario confirma la selección de su plantilla y módulos,
- **Cuando** presiona *"Continuar"*,
- **Entonces** se guardan las preferencias en la base de datos y se avanza al siguiente paso del asistente comercial.

---

## 🖥️ Componentes y Pantallas Asociadas
- `SectorSelectionScreen.tsx` — Pantalla de selección.
- `SectorTemplateCard.tsx` — Tarjeta visual con módulos sugeridos.
- Store: `useSectorTemplateStore`.

---

## 🔗 Referencias Relacionadas
- Feature de Plantillas: [[Feature Sector Templates]]
- Asistente de Negocio: [[Feature Business Onboarding]]
- MOC Principal: [[Indice General]]
