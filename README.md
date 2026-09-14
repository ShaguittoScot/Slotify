# Slotify - Frontend (Mobile App) 📱

Aplicación móvil de reservas y turnos desarrollada con **React Native**, **Expo** y **TypeScript**.

---

## 🔗 Repositorio Backend

El backend de la plataforma (API .NET 8 con Clean Architecture y PostgreSQL) se encuentra en:
👉 [Slotify Backend Repository](https://github.com/ShaguittoScot/Slotify_back)

---

## 🛠️ Tecnologías y Herramientas

- **React Native** & **Expo SDK 52**
- **Expo Router** (Navegación basada en archivos)
- **TypeScript**
- **React Native Paper** / Componentes UI modernos
- **Lucide Icons**
- **AsyncStorage**

---

## 🚀 Inicio Rápido

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/ShaguittoScot/Slotify.git
   cd Slotify
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` tomando como base `.env.example`:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Iniciar el servidor de desarrollo Expo**:
   ```bash
   npx expo start
   ```

5. **Ejecutar en emulador/dispositivo**:
   - Presiona `a` para abrir en el emulador de **Android**.
   - Presiona `w` para abrir en el navegador **Web**.
   - Escanea el código QR con la app **Expo Go** desde tu móvil.

---

## 📁 Estructura del Proyecto

```
Slotify/
├── android/            # Configuración nativa de Android
├── assets/             # Imágenes, iconos y fuentes
├── src/                # Código fuente de la app
│   ├── api/            # Clientes HTTP y servicios de API
│   ├── app/            # Rutas y pantallas (Expo Router)
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # React Contexts (Auth, Theme, etc.)
│   ├── hooks/          # Custom hooks
│   └── types/          # Definiciones de tipos TypeScript
├── app.json            # Configuración de Expo
├── package.json        # Dependencias y scripts
└── tsconfig.json       # Configuración de TypeScript
```
