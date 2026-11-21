# ✨ Primitivas UI y Microinteracciones

> [!abstract] Resumen del Módulo
> Conjunto de componentes base y primitivas interactivas en `src/components/ui/` construidos sobre **React Native Reanimated** y **Expo Symbols**. Aplican físicas de resorte (*Spring Physics*), halos luminosos ambientales y respuesta táctil para dotar a la aplicación de una experiencia de usuario fluida y de alto nivel.

---

## 🧩 Catálogo de Primitivas

### 1. `FluidButton` (`src/components/ui/FluidButton.tsx`)
Botón de llamada a la acción (CTA) con física elástica y halo de respiración:
- **Compresión Táctil:** Al pulsar se escala a `0.97` mediante `withSpring({ damping: 15, stiffness: 300 })`.
- **Halo Luminoso:** Efecto pulsante continuo en estado activo mediante `withRepeat(withSequence(...))`.
- **Micro-movimiento en Flecha:** Desplazamiento sutil del icono en el eje X durante la interacción.
- **Área Táctil Confortable:** Altura fija de 52 dp (cumpliendo con la directiva WCAG $\ge 48\times 48\text{ dp}$).
- **Variantes:** `primary` (índigo intenso) y `emerald` (esmeralda confirmación).

### 2. `FluidToggleSwitch` (`src/components/ui/FluidToggleSwitch.tsx`)
Interruptor alternativo con rebote físico y cambio de tonalidad gradual:
- Desplazamiento orgánico del *thumb* mediante interpolación de `sharedValue`.
- Modificación del color de riel entre el gris neutro del tema y el color de acento.

### 3. `AmbientGlowOrbs` (`src/components/ui/AmbientGlowOrbs.tsx`)
Fondo ambiental orgánico compuesto por orbes luminosos flotantes:
- Simula una atmósfera sutil de iluminación detrás de tarjetas o pantallas de bienvenida (`WelcomeScreen`, `RegisterScreen`).
- Movimiento continuo con trayectorias no lineales y opacidades variables sin saturar la CPU del dispositivo.

### 4. `BottomSheet` (`src/components/ui/BottomSheet.tsx`)
Panel deslizante inferior arrastrable para flujos auxiliares y selección rápida:
- Integrado con gestos táctiles mediante `PanResponder` / `react-native-gesture-handler`.
- Cierre mediante arrastre hacia abajo con umbral de velocidad y botón de cierre táctil.
- Fondo con desenfoque y atenuación (*Backdrop blur*).

### 5. `Collapsible` (`src/components/ui/collapsible.tsx`)
Contenedor acordeón animado para colapsar y expandir secciones de configuración o filtros:
- Anima suavemente la altura del contenido sin saltos bruscos en el diseño.

---

## 💻 Ejemplo: Integración de `FluidButton` y `FluidToggleSwitch`

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { FluidButton } from '@/components/ui/FluidButton';
import { FluidToggleSwitch } from '@/components/ui/FluidToggleSwitch';

export const SettingsSection = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text>Notificaciones push de citas</Text>
        <FluidToggleSwitch 
          value={notificationsEnabled} 
          onValueChange={setNotificationsEnabled} 
        />
      </View>

      <FluidButton
        label="Guardar Configuración"
        variant="primary"
        onPress={() => console.log('Guardado')}
      />
    </View>
  );
};
```

---

## 🔗 Referencias Relacionadas
- Tokens y Animaciones: [[Sistema de Diseno y Tokens]]
- Barra Flotante: [[FloatingTabBar]]
- MOC Principal: [[Indice General]]
