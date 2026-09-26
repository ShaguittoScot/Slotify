/**
 * US-006: Catálogo Canónico de Giros Comerciales (Seed Data)
 * 
 * Contiene los giros comerciales base para el selector de onboarding.
 * Se sincronizan con los registros seed de la base de datos PostgreSQL y backend .NET.
 */

import type { SectorCategory } from '../types';

export const CANONICAL_SECTOR_CATEGORIES: SectorCategory[] = [
  {
    id: 1,
    key: 'salud-bienestar',
    name: 'Salud y Bienestar',
    tagline: 'Clínicas, Consultorios, Odontología y Nutrición',
    description: 'Gestión especializada de citas clínicas, expedientes, historial de consultas y recordatorios preventivos.',
    iconName: 'heart.fill',
    defaultModules: ['citas', 'expedientes', 'recordatorios_sms', 'servicios_clinicos'],
    suggestedServices: [
      { name: 'Consulta Médica General', durationMinutes: 45, price: 500 },
      { name: 'Valoración / Diagnóstico Especializado', durationMinutes: 30, price: 400 },
      { name: 'Sesión de Fisioterapia / Rehabilitación', durationMinutes: 60, price: 650 },
      { name: 'Limpieza y Revisión Dental', durationMinutes: 45, price: 550 },
    ],
    isCustomCanvas: false,
  },
  {
    id: 2,
    key: 'belleza-cuidado',
    name: 'Belleza y Cuidado Personal',
    tagline: 'Barberías, Salones de Belleza, Spas y Uñas',
    description: 'Control de sillones, estilistas, servicios combinados, cálculo de propinas/comisiones y catálogo visual.',
    iconName: 'sparkles',
    defaultModules: ['citas', 'empleados', 'comisiones', 'galeria_trabajos'],
    suggestedServices: [
      { name: 'Corte de Cabello & Barba Clásica', durationMinutes: 45, price: 250 },
      { name: 'Manicure & Pedicure Spa', durationMinutes: 60, price: 380 },
      { name: 'Tratamiento Facial Hidratante', durationMinutes: 50, price: 480 },
      { name: 'Tinte & Peinado Profesional', durationMinutes: 90, price: 750 },
    ],
    isCustomCanvas: false,
  },
  {
    id: 3,
    key: 'fitness-deportes',
    name: 'Fitness y Deportes',
    tagline: 'Entrenadores Personales, Gimnasios, Yoga y Pilates',
    description: 'Reserva de clases grupales con cupo limitado, sesiones personalizadas 1 a 1 y membresías periódicas.',
    iconName: 'figure.run',
    defaultModules: ['citas_grupales', 'aforo_limite', 'instructores', 'membresias'],
    suggestedServices: [
      { name: 'Entrenamiento Personalizado 1 a 1', durationMinutes: 60, price: 350 },
      { name: 'Clase Grupal de Funcional / HIIT', durationMinutes: 50, price: 150 },
      { name: 'Sesión de Yoga / Pilates Reformer', durationMinutes: 55, price: 220 },
      { name: 'Evaluación y Plan Físico Mensual', durationMinutes: 40, price: 300 },
    ],
    isCustomCanvas: false,
  },
  {
    id: 4,
    key: 'servicios-profesionales',
    name: 'Servicios Profesionales',
    tagline: 'Consultoría, Asesoría Legal, Contaduría y Psicología',
    description: 'Agendamiento de reuniones presenciales o videollamadas, cobro de anticipos y gestión de expedientes corporativos.',
    iconName: 'briefcase.fill',
    defaultModules: ['citas', 'videollamadas', 'anticipos', 'facturacion'],
    suggestedServices: [
      { name: 'Sesión de Diagnóstico Inicial (30 min)', durationMinutes: 30, price: 450 },
      { name: 'Consultoría Estratégica / Especializada', durationMinutes: 60, price: 900 },
      { name: 'Terapia Psicológica Individual', durationMinutes: 50, price: 600 },
      { name: 'Revisión y Dictamen Jurídico/Contable', durationMinutes: 90, price: 1200 },
    ],
    isCustomCanvas: false,
  },
  {
    id: 5,
    key: 'barberia',
    name: 'Barbería y Cuidado Personal',
    tagline: 'Sillones, Barberos, Combos y Cuidado de Barba',
    description: 'Control de sillones de atención, asignación de barberos, combos de corte y barba, servicios adicionales y cálculo de comisiones.',
    iconName: 'mustache.fill',
    defaultModules: [
      'citas',
      'empleados',
      'sillones',
      'servicios_adicionales',
      'comisiones',
      'recordatorios_sms',
      'galeria_trabajos',
    ],
    suggestedServices: [
      { name: 'Corte de Cabello Clásico', durationMinutes: 30, price: 200 },
      { name: 'Arreglo y Perfilado de Barba', durationMinutes: 30, price: 150 },
      { name: 'Combo Corte y Barba Completa', durationMinutes: 45, price: 320 },
      { name: 'Afeitado Tradicional con Navaja', durationMinutes: 45, price: 220 },
      { name: 'Corte Premium & Ritual Toalla Caliente', durationMinutes: 60, price: 420 },
    ],
    suggestedAddons: [
      {
        id: 'addon-lavado',
        name: 'Lavado y Exfoliación Capilar',
        durationMinutes: 15,
        price: 80,
        description: 'Shampoo tonificante y masaje de cuero cabelludo con toalla tibia',
        isPopular: true,
      },
      {
        id: 'addon-mascarilla',
        name: 'Mascarilla Negra Purificante',
        durationMinutes: 15,
        price: 90,
        description: 'Limpieza de poros con efecto peel-off y carbón activado',
        isPopular: true,
      },
      {
        id: 'addon-grecas',
        name: 'Diseño de Grecas / Líneas Navaja',
        durationMinutes: 15,
        price: 70,
        description: 'Perfilado artístico a navaja libre o degradado personalizado',
        isPopular: false,
      },
      {
        id: 'addon-tonico',
        name: 'Tónico Capilar & Cera Fijadora',
        durationMinutes: 10,
        price: 50,
        description: 'Acabado profesional de brillo o mate de larga fijación',
        isPopular: false,
      },
    ],
    suggestedStations: [
      { id: 'station-1', name: 'Sillón 1 (Principal)', assignedStaffName: 'Barbero Titular', isActive: true },
      { id: 'station-2', name: 'Sillón 2 (Corte & Barba)', assignedStaffName: 'Especialista Barba', isActive: true },
      { id: 'station-3', name: 'Sillón 3 (Master Barber)', assignedStaffName: 'Master Barber', isActive: true },
    ],
    isCustomCanvas: false,
  },
  {
    id: 99,
    key: 'otro-general',
    name: 'Otro / Servicios Generales',
    tagline: 'Lienzo modular básico sin módulos preestablecidos',
    description: 'Ideal si tu negocio no entra en los rubros convencionales. Inicia con un espacio limpio y agrega solo lo que necesites.',
    iconName: 'square.grid.2x2',
    defaultModules: ['citas', 'servicios'],
    suggestedServices: [
      { name: 'Servicio Estándar', durationMinutes: 30, price: 250 },
    ],
    isCustomCanvas: true,
  },
];
