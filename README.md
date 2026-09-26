# Slotify

> **Plataforma Integral de Gestión de Citas, Agendas y Turnos Inteligentes**  
> Solución móvil y web moderna diseñada para optimizar la operativa de negocios de servicios (B2B) y enriquecer la experiencia de reserva de los clientes (B2C).

---

## Resumen del Proyecto y Metodología

El desarrollo de este proyecto se rige bajo la metodología ágil **Scrum**, gestionando el ciclo de vida de desarrollo a través de tableros **Jira**, entregas iterativas por **Sprints** y control de versiones estructurado por **Feature Branches**.

Esta rama (`feature/US-003-US-008-calendario-agenda`) integra los módulos nucleares de experiencia interactiva de turnos y configuración operativa de negocios.

---

## Historias de Usuario Implementadas en esta Rama

| Código Jira | Historia de Usuario | Descripción Técnica | Criterios de Aceptación / Estado |
| :--- | :--- | :--- | :--- |
| **US-003** | **Calendario Táctil e Interactivo** | Selector táctil de fechas con navegación fluida entre vistas (mensual y diaria). Renderizado de slots con codificación de estados por color (disponible, reservado, bloqueado). | **Cumplido:** Feedback táctil inmediato, micro-animaciones a 60fps con Reanimated, sincronización de fecha seleccionada en store global. |
| **US-008** | **Agenda y Gestión de Bloques de Turnos** | Configuración operativa de la disponibilidad del negocio. Definición de intervalos de atención, descansos, capacidades máximas por franja horaria y bloqueos de agenda. | **Cumplido:** Creación, edición y eliminación de bloques con validación de solapamiento horario y persistencia de estado. |
| **US-006** | **Selector de Giros y Plantillas Comerciales** | Módulo de Onboarding inicial para negocios. Permite seleccionar el sector comercial (Barbería, Medicina, Belleza, Consultoría) y precarga plantillas predeterminadas de horarios y servicios. | **Cumplido:** Carrusel interactivo de plantillas, selección visual de giro y configuración modular en store. |

---

## Arquitectura de Software: Feature-Based Architecture (FBA)

El frontend está diseñado bajo el patrón arquitectónico **Feature-Based Architecture (FBA)**, promoviendo alta cohesión y bajo acoplamiento:

```
Slotify/
├── backend/                  # Módulos y servicios de soporte API
├── frontend/                 # Aplicación móvil React Native / Expo
│   ├── assets/               # Fuentes tipográficas, iconos e imágenes
│   ├── scripts/              # Polyfills y utilidades de entorno de desarrollo
│   ├── src/
│   │   ├── app/              # Enrutamiento basado en archivos (Expo Router)
│   │   │   ├── (auth)/       # Flujos de autenticación y bienvenida
│   │   │   ├── (main)/       # Vistas protegidas principales (Dashboard, Explorador)
│   │   │   ├── (onboarding)/ # Wizard de configuración inicial de negocio
│   │   │   └── _layout.tsx   # Layout raíz con proveedores globales
│   │   ├── components/       # Componentes de UI comunes y reutilizables
│   │   ├── features/         # Módulos de dominio aislados (FBA)
│   │   │   ├── auth/         # Lógica, servicios y pantallas de autenticación
│   │   │   ├── calendar/     # Lógica, modelo y componentes táctiles de US-003
│   │   │   ├── schedule-blocks/ # Gestión y validación de bloques de US-008
│   │   │   └── sector-templates/ # Plantillas y selector comercial de US-006
│   │   ├── shared/           # Capa transversal compartida
│   │   │   ├── lib/          # Clientes HTTP, adaptadores de almacenamiento y Supabase
│   │   │   └── theme/        # Tokens de diseño (Colores, Tipografía, Espaciado)
│   │   └── hooks/            # Custom React Hooks compartidos
│   ├── app.json              # Configuración del ecosistema Expo SDK
│   ├── package.json          # Dependencias y scripts de ejecución
│   └── tsconfig.json         # Configuración de compilación TypeScript estricto
├── .gitignore                # Reglas estrictas de exclusión de Git
└── README.md                 # Documentación técnica del proyecto
```

---

## Stack Tecnológico

* **Core:** [React Native](https://reactnative.dev/) `0.86+` & [Expo SDK](https://expo.dev/) `54+`
* **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (Navegación declarativa nativa por sistema de archivos)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Tipado estricto en interfaces, DTOs y modelos)
* **Animaciones & Gestos:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) y `Gesture Handler` (Micro-interacciones a 60fps)
* **Gestión de Estado:** [Zustand](https://zustand-demo.pmnd.rs/) (Stores modulares para calendario, agenda y sesión)
* **Consumo Asíncrono:** [TanStack React Query](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
* **Persistencia Segura:** `expo-secure-store` y `@react-native-async-storage/async-storage`

---

## Guía de Instalación y Ejecución Local

### Prerrequisitos
* **Node.js:** Versión LTS recomendada (`v20.x` o superior)
* **Gestor de paquetes:** `npm` (`v10.x` o superior)
* **Dispositivo móvil (Opcional):** Aplicación **Expo Go** instalada desde Google Play Store o Apple App Store.

### 1. Clonar el Repositorio y Ubicarse en la Rama
```bash
git clone https://github.com/ShaguittoScot/Slotify.git
cd Slotify
git checkout feature/US-003-US-008-calendario-agenda
```

### 2. Instalar Dependencias del Frontend
```bash
cd frontend
npm install
```

### 3. Configurar Variables de Entorno
Copia el archivo de ejemplo para configurar tus variables locales:
```bash
cp .env.example .env
```
*(Nota: El archivo `.env` está protegido en `.gitignore` y jamás debe subirse a Git).*

### 4. Iniciar el Servidor de Desarrollo Expo
Puedes ejecutar la aplicación en el modo de tu preferencia:

* **Modo Web (Navegador local):**
  ```bash
  npm run web
  ```
* **Modo Red / Móvil con Tunnel (Recomendado para Expo Go):**
  ```bash
  npm run start:tunnel
  ```
* **Modo Android (Emulador):**
  ```bash
  npm run android
  ```

---

## Estándares de Calidad y Buenas Prácticas de Git

1. **Protección de Credenciales:**
   * Cumplimiento estricto de las directrices de seguridad de OWASP y políticas de Git.
   * Ningún secreto, API key o cadena de conexión a bases de datos se encuentra rastreado en este repositorio.
2. **Convención de Commits:**
   * Uso de [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
3. **Mantenimiento de Código Limpio:**
   * Modularización mediante FBA.
   * Cero código acoplado o llamadas directas en componentes de presentación.
