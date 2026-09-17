# 🤖 Directrices y Reglas para el Agente de Desarrollo (AGENTS.md)

Este documento condensa los principios fundamentales, estándares de arquitectura, seguridad, buenas prácticas y flujo de trabajo que el agente de IA y el equipo de desarrollo deben aplicar en cada tarea y generación de código.

---

## 🧭 1. Flujo de Trabajo en Git y Colaboración

1. **Jerarquía de Ramas Estricta:**
   - `main`: Rama de producción estable. **Nunca commitear directamente a `main`**.
   - `sprint-X` (ej. `sprint-1`): Rama de integración del ciclo actual.
   - `feature/<nombre-tarea>` (ej. `feature/login-auth`): Rama de trabajo individual creada a partir de `sprint-X`.
2. **Conventional Commits Obligatorios:**
   - Formato: `<tipo>(<alcance>): <descripción concisa en presente>`
   - Tipos válidos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`.
   - Ejemplo: `feat(auth): implementar inicio de sesión con JWT y ViewModel`.
3. **Resolución Preventiva de Conflictos:**
   - Antes de abrir o actualizar un Pull Request (PR):
     ```bash
     git fetch origin sprint-X
     git merge origin/sprint-X
     ```
   - Resolver conflictos localmente en la rama `feature/` antes de solicitar Code Review.

---

## 🧩 2. Principios de Diseño de Código (SOLID)

1. **S — Single Responsibility (Responsabilidad Única):**
   - Cada clase, módulo o función debe tener **una sola razón para cambiar**.
   - *Regla móvil/web:* No mezclar consumo de red, parseo JSON, lógica de negocio y renderizado visual en una sola clase (`Activity`, `Fragment`, `Component`).
2. **O — Open/Closed (Abierto/Cerrado):**
   - El código debe estar **abierto a la extensión pero cerrado a la modificación**.
   - Usar patrones como *Strategy*, *Factory* y polimorfismo para soportar nuevas variantes sin editar código probado.
3. **L — Liskov Substitution (Sustitución de Liskov):**
   - Las subclases o implementaciones deben sustituir a sus clases base/interfaces sin romper el comportamiento esperado ni arrojar excepciones no contempladas.
4. **I — Interface Segregation (Segregación de Interfaces):**
   - Preferir interfaces pequeñas y altamente específicas (contratos reducidos) frente a interfaces monolíticas gigantescas.
5. **D — Dependency Inversion (Inversión de Dependencias):**
   - Los módulos de alto nivel (negocio/dominio) no deben depender de módulos de bajo nivel (bases de datos, HTTP, frameworks). Ambos dependen de **abstracciones (interfaces)**.
   - Aplicar inyección de dependencias (DI).

---

## 🏗️ 3. Arquitectura de Software y Patrones

### A. Capa de Presentación Móvil / Frontend
- **Evitar el Anti-Patrón MVC / God Object:** No acumular toda la lógica en la Vista.
- **Adoptar MVVM (Model-View-ViewModel) Reactivo:**
  - **View (Vista):** Es un observador pasivo. Escucha estados y emite eventos de usuario.
  - **ViewModel:** Expone estados reactivos unidireccionales (StateFlow / LiveData / Observables), procesa la lógica de presentación y **sobrevive a los cambios de configuración / rotación de pantalla**.
  - **Model:** Lógica de datos y negocio.

### B. Organización Interna (Clean Architecture & Hexagonal)
- **Regla de Dependencia Concéntrica:** Las dependencias siempre apuntan hacia adentro:
  $$\text{Frameworks/UI/DB} \longrightarrow \text{Adaptadores/Presenters} \longrightarrow \text{Casos de Uso} \longrightarrow \text{Dominio/Entidades}$$
- **Patrón Repository:** Desacoplar la fuente de datos (local SQLite/Room vs remota REST API) de la lógica de dominio.

### C. Nivel de Sistema & Backend
- **Monolito / Monolito Modular:** Para proyectos en fase inicial o media con baja complejidad de despliegue.
- **Microservicios con API Gateway:** Para sistemas distribuidos de alta escala, centralizando autenticación, enrutamiento y limitación de tasa (*Rate Limiting*).
- **Event-Driven Architecture (EDA):** Comunicación asíncrona mediante brokers de eventos para alta concurrencia.

---

## 📱 4. Ciclo de Vida y Gestión de Estado

1. **Estados del Ciclo de Vida:**
   - **Foreground (Primer Plano):** Conectar sensores, animaciones y suscripciones en tiempo real.
   - **Background (Segundo Plano):** Pausar cómputo intensivo, liberar hardware (cámara/GPS) y persistir datos temporales en almacenamiento local o bundles.
   - **Destroyed / Low Memory Killer (LMK):** Preparar la app para reinicios limpios reconstituyendo el estado desde el ViewModel o base de datos.
2. **Prevención de Fugas de Memoria:** Cancelar corrutinas, timers, suscripciones a observables y listeners al destruir vistas.

---

## 🛡️ 5. Seguridad: "Zero Trust" y Cliente Hostil

1. **El Cliente es un Entorno Expuesto:**
   - Todo paquete compilado (`.apk`, `.ipa`, bundle JS) puede ser descompilado e inspeccionado.
   - **PROHIBIDO** almacenar claves privadas maestras, tokens secretos o credenciales en duro (*hardcoded*).
   - Validar ofuscación de código en producción (R8 / ProGuard).
2. **Almacenamiento Local Seguro:**
   - Nunca guardar datos confidenciales en texto plano (`SharedPreferences` estándar, `UserDefaults`, SQLite simple).
   - Usar `EncryptedSharedPreferences` / `Android Keystore` / `SQLCipher` en Android y `Keychain Services` / `CryptoKit` en iOS.
3. **Backend Zero Trust (Cero Confianza):**
   - El servidor **nunca confía en los datos recibidos del cliente**. Toda validación y regla de negocio crítica debe validarse en el backend.
   - Autenticación mediante tokens criptográficos **Stateless (JWT / OAuth2)** en cabeceras `Authorization: Bearer <token>` con expiración controlada.
   - **Principio del Mínimo Privilegio (PoLP):** Otorgar únicamente los permisos indispensables por rol/token.

---

## 🌐 6. Diseño y Consumo de APIs RESTful

1. **Principios REST:**
   - Arquitectura Cliente-Servidor desacoplada y comunicación **Stateless** (sin guardar sesiones en la memoria del servidor).
2. **Semántica de Métodos HTTP:**
   - `GET`: Consulta / Lectura (Idempotente y Seguro).
   - `POST`: Creación de recurso (No idempotente).
   - `PUT`: Reemplazo total de un recurso (Idempotente).
   - `PATCH`: Modificación parcial de un recurso (No idempotente).
   - `DELETE`: Eliminación de un recurso (Idempotente).
3. **Manejo Estricto de Códigos HTTP:**
   - `200 OK` (Lectura/actualización con retorno), `201 Created` (Nuevo recurso), `204 No Content` (Éxito sin cuerpo).
   - `400 Bad Request` (Datos inválidos), `401 Unauthorized` (Sin token/autenticación), `403 Forbidden` (Sin permisos), `404 Not Found` (No existe).
   - `500 Internal Server Error` (Fallo de servidor).

---

## 💾 7. Almacenamiento y Persistencia

1. **SQL (Relacional - SQLite, Room, PostgreSQL):**
   - Esquemas definidos, relaciones e integridad referencial estricta.
   - Garantía de propiedades **ACID** (Atomicidad, Consistencia, Aislamiento, Durabilidad) para transacciones críticas.
2. **NoSQL (Documentos/Clave-Valor - Firestore, Redis, MongoDB):**
   - Esquemas dinámicos y escalabilidad horizontal de alta velocidad para lecturas/escrituras simples.
3. **Teorema CAP:**
   - Ante una partición de red (*P*), elegir conscientemente entre Consistencia estricta (*CP*) o Disponibilidad inmediata con consistencia eventual (*AP*).

---

## 🚀 8. Integración y Entrega Continua (CI/CD)

1. **CI (Integración Continua):**
   - En cada Pull Request: compilar automáticamente, ejecutar análisis estático (linter) y correr la suite de pruebas unitarias/integración.
2. **CD (Entrega / Despliegue Continuo):**
   - Generar artefactos firmados de manera reproducible (`.aab`, `.apk`, contenedores Docker) listos para distribución en ambientes de staging o tiendas de aplicaciones.

---

## 📋 Checklist Rápido para el Agente en Cada Tarea

- [ ] ¿El código respeta el principio de responsabilidad única (SRP)?
- [ ] ¿Se utiliza inyección de dependencias o interfaces para evitar acoplamientos rígidos (DIP)?
- [ ] ¿La capa visual reacciona a un estado observable (MVVM) en lugar de ejecutar lógica de negocio?
- [ ] ¿Se manejan errores de red, ciclo de vida y posibles estados nulos/fallidos de forma controlada?
- [ ] ¿Se protegió el almacenamiento de datos sensibles y no hay credenciales en texto plano?
- [ ] ¿Las validaciones críticas de negocio se garantizan en el servidor (Zero Trust)?
- [ ] ¿El commit y la rama siguen las convenciones (`feature/...` y `feat/fix(...)`)?
