# 🚀 Compilación con EAS y Despliegue

> [!abstract] Resumen de la Guía
> Guía paso a paso para compilar y generar binarios nativos reproducibles (Android APK / AAB e iOS IPA / Simulator Build) utilizando **Expo Application Services (EAS Build)** y **Expo Prebuild**.

---

## 📦 Estructura de Configuración de `eas.json`

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🛠️ Comandos de Compilación EAS

### 1. Iniciar Sesión en EAS
```bash
npx eas login
npx eas project:init
```

### 2. Generar APK de Pruebas Internas (Android)
```bash
npx eas build --platform android --profile preview
```
> [!success] Artefacto APK Directo
> El perfil `preview` genera un archivo `.apk` autónomo descargable e instalable directamente en cualquier dispositivo Android sin pasar por Google Play Store.

### 3. Generar Bundle de Producción para Google Play Store (.aab)
```bash
npx eas build --platform android --profile production
```

### 4. Compilación Local con Android SDK (Prebuild)
Si prefieres compilar localmente con tu instalación de Android Studio:
```bash
# 1. Generar proyecto nativo android/
npx expo prebuild --platform android

# 2. Compilar APK Release localmente con Gradle
cd android
./gradlew assembleRelease
```

---

## 🔍 Verificación Previa a la Compilación (Checklist)

- [x] ¿Las variables `EXPO_PUBLIC_*` están configuradas en las variables de entorno de EAS (`eas env:create`)?
- [x] ¿El archivo `app.json` tiene asignado un `package` único para Android (`com.slotify.app`)?
- [x] ¿Los íconos adaptativos y splash screens se encuentran en `assets/images/`?
- [x] ¿Las dependencias nativas están alineadas con Expo SDK 57 (`npx expo doctor`)?
- [x] ¿La suite de pruebas unitarias pasa exitosamente (`npm test`)?

---

## 🔗 Referencias Relacionadas
- Variables de Entorno: [[Configuracion de Entorno y Variables]]
- Pipeline y Pruebas: [[Estrategia de Pruebas Unitarias y CI Pipeline]]
- Arquitectura FDD: [[Arquitectura y FDD]]
- MOC Principal: [[Indice General]]
