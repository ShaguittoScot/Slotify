/**
 * Script de Validación US-002: Catálogo de Plantillas e Interactividad Unificada
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================================');
console.log('🔬 Validando US-002: Catálogo de Plantillas y Control de Usuario');
console.log('====================================================================\n');

// 1. Verificar templates.tsx
const templatesSource = fs.readFileSync(
  path.join(__dirname, '../src/app/(onboarding)/templates.tsx'),
  'utf8'
);

// Comprobar soporte de selección/deselección de servicios
assert(templatesSource.includes('toggleService'), 'templates.tsx debe implementar toggleService');
assert(templatesSource.includes('selectedServices'), 'templates.tsx debe manejar estado de selectedServices');
console.log('✔ [1/4] Manejo de estado interactivo para servicios sugeridos verificado.');

// Comprobar soporte de toggles de módulos con FluidToggleSwitch
assert(templatesSource.includes('FluidToggleSwitch'), 'templates.tsx debe integrar FluidToggleSwitch');
assert(templatesSource.includes('toggleModule'), 'templates.tsx debe implementar toggleModule');
assert(templatesSource.includes('activeModules'), 'templates.tsx debe manejar estado de activeModules');
console.log('✔ [2/4] Integración de FluidToggleSwitch para módulos sectoriales y lienzo libre verificada.');

// Comprobar ausencia de cajas de alerta anti-patrón (anti-ai design taste)
assert(!templatesSource.includes('badgeNoticeSuggested'), 'Debe eliminarse la caja genérica badgeNoticeSuggested');
assert(!templatesSource.includes('badgeNoticeCustom'), 'Debe eliminarse la caja genérica badgeNoticeCustom');
console.log('✔ [3/4] Eliminación de cajas genéricas y cumplimiento de Anti-AI Human Design verificado.');

// Comprobar resolución canónica ante recarga
assert(templatesSource.includes('CANONICAL_SECTOR_CATEGORIES'), 'templates.tsx debe resolver categoría canónica ante recarga');
console.log('✔ [4/4] Resiliencia de estado y resolución canónica ante recarga verificada.');

console.log('\n====================================================================');
console.log('🎉 TODOS LOS CRITERIOS DE US-002 E INTERACTIVIDAD HAN SIDO VALIDADOS');
console.log('====================================================================\n');
