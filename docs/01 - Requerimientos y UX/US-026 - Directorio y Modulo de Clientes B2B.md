# 👥 US-026 - Directorio y Módulo de Clientes B2B

> [!abstract] Descripción de la Historia
> **Como** administrador de un comercio,
> **quiero** consultar un listado organizado de todos los clientes que han reservado servicios,
> **para** acceder a sus datos de contacto directo, ver su historial de citas y gestionar su fidelización.

---

## 🎯 Criterios de Aceptación (Gherkin)

### Escenario 1: Búsqueda y filtrado de clientes
- **Dado** que el administrador ingresa a `ClientsScreen`,
- **Cuando** escribe en la barra de búsqueda el nombre *"Carlos"* o su teléfono *"5544"*,
- **Entonces** la lista filtra en tiempo real mostrando únicamente los registros coincidentes.

### Escenario 2: Llamada telefónica rápida
- **Dado** que un cliente tiene su número registrado en el perfil,
- **Cuando** el administrador presiona el icono de teléfono en la tarjeta del cliente,
- **Entonces** el sistema invoca la API nativa de llamadas del dispositivo (`Linking.openURL('tel:...')`) con el número premarcado.

### Escenario 3: Estado vacío sin clientes registrados
- **Dado** que un negocio nuevo no tiene citas ni clientes en su base de datos,
- **Cuando** abre la pestaña de clientes,
- **Entonces** se despliega un estado vacío ilustrado con un botón directo para copiar y compartir el enlace de reserva pública.

---

## 🖥️ Componentes y Pantallas Asociadas
- `ClientsScreen.tsx` — Pantalla principal del directorio.
- `src/features/clients` — Módulo FDD de clientes.

---

## 🔗 Referencias Relacionadas
- Feature de Clientes: [[Feature Clients]]
- Dashboard B2B: [[Feature Business Dashboard]]
- MOC Principal: [[Indice General]]
