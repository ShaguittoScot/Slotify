# 🔔 ToastNotification

> [!abstract] Resumen del Componente
> `src/components/ui/ToastNotification.tsx` es una notificación flotante contextual (toast/snackbar) no bloqueante con micro-animaciones en **React Native Reanimated**, soporte para cuatro variantes semánticas y cierre temporizado automático.

---

## 🎨 Variantes Semánticas y Estilos

| Variante (`type`) | Icono (Feather) | Color de Acento | Fondo (Dark / Light) | Propósito de Uso |
| :--- | :---: | :---: | :---: | :--- |
| `success` | `check-circle` | `#10B981` (Esmeralda) | `rgba(16, 185, 129, 0.15)` | Confirmación de cita, guardado exitoso |
| `error` | `alert-circle` | `#EF4444` (Rojo) | `rgba(239, 68, 68, 0.15)` | Fallos rápidos o advertencias críticas |
| `warning` | `alert-triangle` | `#F59E0B` (Ámbar) | `rgba(245, 158, 11, 0.15)` | Horario próximo a vencer, conflicto menor |
| `info` | `info` | `#818CF8` (Índigo) | `rgba(99, 102, 241, 0.15)` | Notificaciones de sincronización o tips |

---

## 📐 Propiedades del Componente (`ToastNotificationProps`)

```typescript
export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastNotificationProps {
  /** Determina si la notificación es visible */
  visible: boolean;
  /** Mensaje de texto a mostrar (máximo 2 líneas) */
  message: string;
  /** Tipo semántico de la notificación */
  type?: ToastType; // Por defecto: 'success'
  /** Tiempo de permanencia en milisegundos antes del autocierre */
  duration?: number; // Por defecto: 2600 ms
  /** Callback ejecutado al completarse la duración */
  onDismiss: () => void;
}
```

---

## ⚡ Animaciones y Posicionamiento

1. **Entrada y Salida Suaves:**
   - Entrada: `FadeInDown.duration(260)`
   - Salida: `FadeOutUp.duration(180)`
2. **Elevación y Superposición:**
   - Contenedor con `pointerEvents="none"` para no interceptar toques en áreas vacías.
   - Posicionamiento superior absoluto con `zIndex: 9999` y compensación de Safe Area (`top: 54` en iOS, `46` en Android).
   - Sombras adaptativas con `shadowOpacity` en iOS y `elevation: 8` en Android.

---

## 💻 Ejemplo de Uso

```tsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { ToastNotification, ToastType } from '@/components/ui/ToastNotification';

export const MyComponent = () => {
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  };

  return (
    <View style={{ flex: 1 }}>
      <Button 
        title="Guardar Cita" 
        onPress={() => showToast('¡Cita agendada correctamente!', 'success')} 
      />

      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};
```

---

## 🔗 Referencias Relacionadas
- Sistema de Diseño y Tokens: [[Sistema de Diseno y Tokens]]
- Banners de Error: [[FormErrorBanner y FormFieldError]]
- Dashboard B2B: [[Feature Business Dashboard]]
- MOC Principal: [[Indice General]]
