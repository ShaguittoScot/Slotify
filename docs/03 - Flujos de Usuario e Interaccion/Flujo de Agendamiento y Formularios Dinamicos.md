# 📅 Flujo de Agendamiento y Formularios Dinámicos

> [!abstract] Resumen del Flujo
> Describe el proceso completo mediante el cual un usuario (desde el explorador de la app o a través de la ruta web pública `/book/[slug]`) selecciona un servicio, elige fecha y horario disponible, responde un formulario dinámico configurable y confirma la reserva.

---

## 🔄 Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Consumidor / Cliente Web
    participant Booking as BookingScreen (/book/[slug])
    participant CalStore as useCalendarStore (Zustand)
    participant FormV as FormViewer (Slides o Scroll)
    participant API as Slotify API Client (.NET 8)
    participant Toast as ToastNotification (UI)

    Cliente->>Booking: Abre enlace o selecciona servicio en la app
    Booking->>CalStore: Carga disponibilidad de slots para la fecha seleccionada
    CalStore-->>Booking: Lista de horarios libres (09:00 AM, 10:00 AM, ...)
    Cliente->>Booking: Selecciona horario (ej. "11:30 AM")
    
    alt Negocio tiene Formulario Dinámico Activo
        Booking->>FormV: Monta FormViewer con schema JSON del negocio
        FormV-->>Cliente: Presenta preguntas interactivas (Typeform o Scroll)
        Cliente->>FormV: Responde campos obligatorios y opcionales
        FormV->>Booking: onSubmit(answers)
    end

    Cliente->>Booking: Confirma datos del cliente (Nombre, Teléfono)
    Booking->>API: POST /api/appointments (o reserva de slot)
    API-->>Booking: 201 Created { appointmentId, status: "confirmed" }
    Booking->>Toast: Despliega notificación de éxito
    Booking-->>Cliente: Pantalla de confirmación con detalles y CTA de calendario
```

---

## 📋 Estilos de Presentación del Formulario Dinámico

El componente [[FormViewer]] soporta dos modos configurables por el administrador:
1. **Interactive Slides (`interactive_slides`):** Experiencia estilo *Typeform* pantalla a pantalla con barra de progreso superior animada y auto-avance en preguntas de opción única.
2. **Classic Scroll (`classic_scroll`):** Formulario tradicional vertical estilo *Google Forms* con validaciones integradas antes de enviar.

---

## 🔗 Referencias Relacionadas
- Requerimiento: [[US-003 - Calendario Tactil y Seleccion de Turnos]]
- Feature UI: [[Feature Calendar & Booking]]
- Componente FormViewer: [[FormViewer]]
- Explorador: [[Feature Consumer Dashboard & Explore]]
