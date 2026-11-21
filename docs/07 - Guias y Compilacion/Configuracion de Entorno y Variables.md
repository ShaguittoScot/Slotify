# ⚙️ Configuración de Entorno y Variables

> [!abstract] Resumen de la Guía
> Explica la gestión de variables de entorno públicas y privadas en **Expo**, las directivas de seguridad para no exponer credenciales sensibles en bundles de producción y la plantilla del archivo `.env`.

---

## 📋 Variables de Entorno Públicas (`EXPO_PUBLIC_*`)

En **Expo SDK 57**, las variables prefijadas con `EXPO_PUBLIC_` son inyectadas en tiempo de compilación (*build-time*) en el bundle JavaScript de la aplicación.

### Plantilla de Archivo `.env`

```ini
# URL Base del Backend en .NET 8 (Slotify_back)
# En emulador Android usar 10.0.2.2 o IP local de la máquina: http://192.168.1.XX:5272/api
EXPO_PUBLIC_API_URL=http://localhost:5272/api

# Configuración del Proyecto Supabase
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica-aqui
```

---

## 🛡️ Reglas de Seguridad ("Zero Trust")

> [!danger] Prohibición de Secretos en el Frontend
> Todo el código compilado (`.apk`, `.ipa`, bundle web) puede ser desensamblado.
> - **NUNCA** coloques la clave `service_role` de Supabase en `.env` o en el frontend.
> - **NUNCA** guardes secretos de conexión a bases de datos PostgreSQL en la app móvil.
> - Las validaciones críticas de negocio y cobro deben validarse obligatoriamente en el servidor en **.NET 8**.

---

## 🏃 Ejecución en Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo de Expo
npm start

# 3. Iniciar directamente en emulador Android
npm run android

# 4. Iniciar en versión Web
npm run web

# 5. Ejecutar suite de pruebas unitarias
npm test
```

---

## 🔗 Referencias Relacionadas
- Integración Supabase: [[Supabase Auth Client]]
- Cliente API: [[Slotify API Client]]
- Estrategia de Pruebas: [[Estrategia de Pruebas Unitarias y CI Pipeline]]
- Guía de Compilación: [[Compilacion con EAS y Despliegue]]
- MOC Principal: [[Indice General]]
