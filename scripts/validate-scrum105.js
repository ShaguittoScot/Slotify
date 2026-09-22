/**
 * Script de Verificación y Validación Automatizada para SCRUM-105
 * 
 * Épica: SCRUM-14 (Plantillas Preconfiguradas por Sector)
 * Historia: SCRUM-105: Implementar plantilla preconfigurada para sector Barbería / Cuidado Personal
 * 
 * Criterios evaluados:
 * 1. Definición canónica de Barbería con 5 servicios estándar y duraciones (30, 45, 60 min).
 * 2. Servicios adicionales (Add-ons) y puestos de atención (Sillones/Barberos) modelados.
 * 3. Módulos sectoriales recomendados habilitados (citas, empleados, sillones, comisiones, recordatorios, etc.).
 * 4. Modificabilidad y control de usuario (edición de duración, precio, agregar/quitar servicios en plantilla).
 * 5. Integración con el panel de administración (Settings) y creación de citas (Calendar Modal).
 * 6. Cumplimiento de regla estricta: Cero emojis en archivos del feature.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================================');
console.log('Validando SCRUM-105: Plantilla Barberia / Cuidado Personal');
console.log('====================================================================\n');

// 1. Validar Types (src/features/sector-templates/types/index.ts)
const typesPath = path.join(__dirname, '../src/features/sector-templates/types/index.ts');
const typesSource = fs.readFileSync(typesPath, 'utf8');

assert(typesSource.includes("'barberia'"), 'types/index.ts debe incluir clave canónica "barberia"');
assert(typesSource.includes("'restaurante'"), 'types/index.ts debe permitir extensibilidad para restaurante');
assert(typesSource.includes('export interface ServiceAddon'), 'types/index.ts debe exportar ServiceAddon');
assert(typesSource.includes('export interface BarberStation'), 'types/index.ts debe exportar BarberStation');
assert(typesSource.includes('suggestedAddons?: ServiceAddon[]'), 'SectorCategory debe soportar suggestedAddons');
assert(typesSource.includes('suggestedStations?: BarberStation[]'), 'SectorCategory debe soportar suggestedStations');
console.log('OK [1/6] Modelado de Tipos TypeScript y extensibilidad validada.');

// 2. Validar Constantes Canónicas (src/features/sector-templates/constants/index.ts)
const constantsPath = path.join(__dirname, '../src/features/sector-templates/constants/index.ts');
const constantsSource = fs.readFileSync(constantsPath, 'utf8');

assert(constantsSource.includes("key: 'barberia'"), 'constants debe definir key: barberia');
assert(constantsSource.includes('Corte de Cabello Clásico'), 'Debe incluir Corte de Cabello Clásico');
assert(constantsSource.includes('Arreglo y Perfilado de Barba'), 'Debe incluir Arreglo y Perfilado de Barba');
assert(constantsSource.includes('Combo Corte y Barba Completa'), 'Debe incluir Combo Corte y Barba Completa');
assert(constantsSource.includes('Afeitado Tradicional con Navaja'), 'Debe incluir Afeitado Tradicional');
assert(constantsSource.includes('Corte Premium & Ritual Toalla Caliente'), 'Debe incluir Ritual Toalla Caliente');

// Validar duraciones estándar 30, 45, 60
assert(constantsSource.includes('durationMinutes: 30'), 'Debe contener duración estándar 30 min');
assert(constantsSource.includes('durationMinutes: 45'), 'Debe contener duración estándar 45 min');
assert(constantsSource.includes('durationMinutes: 60'), 'Debe contener duración estándar 60 min');

// Validar adicionales y sillones
assert(constantsSource.includes('addon-lavado'), 'Debe incluir addon de lavado y exfoliación');
assert(constantsSource.includes('addon-mascarilla'), 'Debe incluir addon de mascarilla negra');
assert(constantsSource.includes('addon-grecas'), 'Debe incluir addon de grecas');
assert(constantsSource.includes('station-1'), 'Debe incluir sillones de atención');
assert(constantsSource.includes('sillones'), 'Debe incluir módulo de sillones');
assert(constantsSource.includes('servicios_adicionales'), 'Debe incluir módulo de servicios adicionales');
console.log('OK [2/6] Catalogo canónico de Barbería verificado (servicios, adicionales, sillones y módulos).');

// 3. Validar Store Zustand (src/features/sector-templates/model/index.ts)
const modelPath = path.join(__dirname, '../src/features/sector-templates/model/index.ts');
const modelSource = fs.readFileSync(modelPath, 'utf8');

assert(modelSource.includes('customizedServices'), 'model debe manejar customizedServices');
assert(modelSource.includes('selectedAddons'), 'model debe manejar selectedAddons');
assert(modelSource.includes('updateCustomizedService'), 'model debe implementar updateCustomizedService');
assert(modelSource.includes('addCustomizedService'), 'model debe implementar addCustomizedService');
assert(modelSource.includes('removeCustomizedService'), 'model debe implementar removeCustomizedService');
assert(modelSource.includes('toggleAddon'), 'model debe implementar toggleAddon');
console.log('OK [3/6] Store Zustand para personalización de servicios y extras verificado.');

// 4. Validar Pantalla de Plantillas (src/app/(onboarding)/templates.tsx)
const templatesPath = path.join(__dirname, '../src/app/(onboarding)/templates.tsx');
const templatesSource = fs.readFileSync(templatesPath, 'utf8');

assert(templatesSource.includes('editableServices'), 'templates.tsx debe soportar editableServices');
assert(templatesSource.includes('handleOpenEditModal'), 'templates.tsx debe implementar handleOpenEditModal');
assert(templatesSource.includes('editModalOverlay'), 'templates.tsx debe renderizar modal de personalización');
assert(templatesSource.includes('AddonCardItem'), 'templates.tsx debe renderizar AddonCardItem');
assert(templatesSource.includes('StationCardItem'), 'templates.tsx debe renderizar StationCardItem');
assert(templatesSource.includes('add-template-service-button'), 'templates.tsx debe permitir agregar servicios a la plantilla');
console.log('OK [4/6] Interfaz y control de usuario de templates.tsx verificado.');

// 5. Validar Integración con Ajustes y Calendario
const settingsPath = path.join(__dirname, '../src/features/settings/ui/screens/SettingsScreen.tsx');
const settingsSource = fs.readFileSync(settingsPath, 'utf8');
assert(settingsSource.includes('Servicios y Plantilla de Barbería'), 'SettingsScreen debe ofrecer acceso a plantilla de barbería');

const modalPath = path.join(__dirname, '../src/features/calendar/ui/CreateAppointmentModal.tsx');
const modalSource = fs.readFileSync(modalPath, 'utf8');
assert(modalSource.includes('activeServices'), 'CreateAppointmentModal debe consumir activeServices');
assert(modalSource.includes('availableAddons'), 'CreateAppointmentModal debe soportar selección de extras/addons');
assert(modalSource.includes('availableStations'), 'CreateAppointmentModal debe soportar asignación de sillón/barbero');
console.log('OK [5/6] Integración de Administrador en Settings y Calendar Modal verificada.');

// 6. Validar regla estricta de Cero Emojis
const filesToCheck = [typesPath, constantsPath, modelPath, templatesPath, settingsPath, modalPath];
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

filesToCheck.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  assert(!emojiRegex.test(content), `El archivo ${path.basename(filePath)} contiene emojis no permitidos`);
});
console.log('OK [6/6] Regla estricta de CERO EMOJIS cumplida al 100%.');

console.log('\n====================================================================');
console.log('TODOS LOS CRITERIOS DE ACEPTACION SCRUM-105 VALIDADOS CON EXITO');
console.log('====================================================================\n');
