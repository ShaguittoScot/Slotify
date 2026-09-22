/**
 * US-002 / US-006: Catálogo de Plantillas por Sector
 * 
 * Pantalla interactiva del Onboarding con estética Glassmorphism UI Premium,
 * control total del usuario y principios Anti-AI / Human Design Taste:
 * - Selección y deselección libre de servicios sugeridos con contador en vivo
 * - Activación y desactivación de módulos sectoriales con FluidToggleSwitch
 * - Misma ergonomía e interactividad táctil tanto en catálogo sugerido como en lienzo libre
 * - Chasis responsivo pulido con orbes ambientales y ausencia de cajas genéricas
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AmbientGlowOrbs } from '@/components/ui/AmbientGlowOrbs';
import { FluidButton } from '@/components/ui/FluidButton';
import { FluidToggleSwitch } from '@/components/ui/FluidToggleSwitch';
import { useSectorTemplateStore } from '@/features/sector-templates';
import { CANONICAL_SECTOR_CATEGORIES } from '@/features/sector-templates/constants';
import type { SuggestedServiceDto, ServiceAddon, BarberStation } from '@/features/sector-templates/types';

// Tipo para servicios personalizados creados por el usuario en modo Lienzo Libre
interface CustomService {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number;
}

// Diccionario de metadatos descriptivos para los módulos del sistema
interface ModuleMeta {
  id: string;
  name: string;
  desc: string;
  required?: boolean;
}

const MODULE_REGISTRY: Record<string, ModuleMeta> = {
  citas: {
    id: 'citas',
    name: 'Agenda y Calendario de Citas',
    desc: 'Gestión de slots, reservaciones en línea y disponibilidad en tiempo real.',
    required: true,
  },
  sillones: {
    id: 'sillones',
    name: 'Sillones y Puestos de Atención',
    desc: 'Control de capacidad física, asignación de estaciones y flujo de clientes.',
  },
  servicios_adicionales: {
    id: 'servicios_adicionales',
    name: 'Servicios Adicionales y Combos',
    desc: 'Venta sugerida de extras (toalla caliente, mascarillas, tónicos) al agendar.',
  },
  citas_grupales: {
    id: 'citas_grupales',
    name: 'Clases Grupales y Aforos',
    desc: 'Control de cupos máximos y reservas para múltiples asistentes por horario.',
    required: true,
  },
  servicios: {
    id: 'servicios',
    name: 'Catálogo de Servicios',
    desc: 'Tiempos de atención, precios base y especificaciones para clientes.',
  },
  servicios_clinicos: {
    id: 'servicios_clinicos',
    name: 'Catálogo de Tratamientos Clínicos',
    desc: 'Servicios de salud con desglose de diagnóstico, valoración y seguimiento.',
  },
  servicios_basicos: {
    id: 'servicios_basicos',
    name: 'Catálogo de Servicios Base',
    desc: 'Configuración ágil de atenciones principales y duración estimada.',
  },
  expedientes: {
    id: 'expedientes',
    name: 'Expedientes Clínicos e Historial',
    desc: 'Notas de evolución por paciente, antecedentes y documentos adjuntos.',
  },
  recordatorios_sms: {
    id: 'recordatorios_sms',
    name: 'Recordatorios Automáticos',
    desc: 'Avisos por WhatsApp y SMS para reducir inasistencias y no-shows.',
  },
  empleados: {
    id: 'empleados',
    name: 'Equipo y Colaboradores',
    desc: 'Turnos independientes, asignación de especialistas y calendarios propios.',
  },
  comisiones: {
    id: 'comisiones',
    name: 'Cálculo de Comisiones',
    desc: 'Control de porcentajes y propinas automáticas para tu personal.',
  },
  galeria_trabajos: {
    id: 'galeria_trabajos',
    name: 'Galería de Resultados',
    desc: 'Muestrario fotográfico de trabajos y peinados para reserva directa.',
  },
  aforo_limite: {
    id: 'aforo_limite',
    name: 'Control de Aforo y Cupos',
    desc: 'Lista de espera automática y límite estricto de participantes por clase.',
  },
  instructores: {
    id: 'instructores',
    name: 'Instructores y Coaches',
    desc: 'Asignación de profesores por disciplina, horarios y sustituciones.',
  },
  membresias: {
    id: 'membresias',
    name: 'Pases y Membresías',
    desc: 'Cobro recurrente, paquetes de sesiones y control de accesos.',
  },
  videollamadas: {
    id: 'videollamadas',
    name: 'Consultas por Videollamada',
    desc: 'Integración automática de enlaces al confirmar la sesión.',
  },
  anticipos: {
    id: 'anticipos',
    name: 'Cobro de Anticipos',
    desc: 'Solicitud de anticipo o pago completo previo para apartar el horario.',
  },
  facturacion: {
    id: 'facturacion',
    name: 'Módulo de Facturación',
    desc: 'Emisión de comprobantes fiscales y recibos tras la cita.',
  },
  pagos_linea: {
    id: 'pagos_linea',
    name: 'Cobro Digital Integrado',
    desc: 'Pasarela segura para tarjetas de débito, crédito y transferencias.',
  },
};

// Componente interactivo para tarjetas de módulo con FluidToggleSwitch
interface ModuleCardItemProps {
  module: ModuleMeta;
  isEnabled: boolean;
  onToggle: (id: string) => void;
  index: number;
}

const ModuleCardItem: React.FC<ModuleCardItemProps> = ({
  module,
  isEnabled,
  onToggle,
  index,
}) => {
  const cardScale = useSharedValue(1);

  const handlePressIn = () => {
    if (!module.required) {
      cardScale.value = withSpring(0.985, { damping: 14, stiffness: 240 });
    }
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const webGlass = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: isEnabled
      ? '0 0 20px rgba(99, 102, 241, 0.2), 0 4px 18px rgba(0, 0, 0, 0.35)'
      : '0 4px 14px rgba(0, 0, 0, 0.25)',
    transition: 'border 0.2s ease, background-color 0.2s ease, box-shadow 0.22s ease, opacity 0.2s ease',
  } as any) : {};

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).springify().damping(16).stiffness(130)}
      style={[styles.moduleCardWrapper, animatedStyle]}
    >
      <Pressable
        testID={`module-card-${module.id}`}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isEnabled, disabled: module.required }}
        accessibilityLabel={`${module.name}. ${module.desc}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onToggle(module.id)}
        disabled={module.required}
        style={[
          styles.moduleCard,
          webGlass,
          isEnabled ? styles.moduleCardActive : styles.moduleCardInactive,
          Platform.OS === 'web' && ({
            cursor: module.required ? 'default' : 'pointer',
          } as any),
        ]}
      >
        <View style={styles.moduleTextContainer}>
          <View style={styles.moduleTitleRow}>
            <Text style={[styles.moduleName, !isEnabled && styles.moduleNameInactive]}>
              {module.name}
            </Text>
            {module.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>NÚCLEO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.moduleDesc, !isEnabled && styles.moduleDescInactive]}>
            {module.desc}
          </Text>
        </View>

        <FluidToggleSwitch
          value={isEnabled}
          disabled={module.required}
          activeColor="#6366F1"
        />
      </Pressable>
    </Animated.View>
  );
};

// Componente interactivo para tarjetas de servicio sugerido con selección/deselección y edición
interface ServiceCardItemProps {
  service: SuggestedServiceDto;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  index: number;
}

const ServiceCardItem: React.FC<ServiceCardItemProps> = ({
  service,
  isSelected,
  onToggle,
  onEdit,
  index,
}) => {
  const cardScale = useSharedValue(1);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.985, { damping: 14, stiffness: 240 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const webGlass = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: isSelected
      ? '0 0 20px rgba(99, 102, 241, 0.22), 0 4px 18px rgba(0, 0, 0, 0.35)'
      : '0 4px 14px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.22s ease',
    cursor: 'pointer',
  } as any) : {};

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).springify().damping(16).stiffness(130)}
      style={[{ width: '100%' }, animatedStyle]}
    >
      <Pressable
        testID={`service-card-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${service.name}. ${service.durationMinutes} minutos. Precio ${service.price ?? 'sin precio'}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onToggle}
        style={[
          styles.serviceCard,
          webGlass,
          isSelected ? styles.serviceCardSelected : styles.serviceCardDeselected,
        ]}
      >
        {/* Icono temático del servicio */}
        <View
          style={[
            styles.serviceIconBox,
            isSelected ? styles.serviceIconBoxSelected : styles.serviceIconBoxDeselected,
          ]}
        >
          <SymbolView
            name={{ ios: 'tag.fill', android: 'label', web: 'label' }}
            size={18}
            tintColor={isSelected ? '#818CF8' : '#4B5563'}
          />
        </View>

        {/* Metadatos del servicio */}
        <View style={styles.serviceContent}>
          <Text
            style={[styles.serviceName, !isSelected && styles.serviceNameDeselected]}
          >
            {service.name}
          </Text>

          <View style={styles.serviceMetaRow}>
            <View style={styles.durationPill}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={12}
                tintColor={isSelected ? '#94A3B8' : '#64748B'}
              />
              <Text style={[styles.durationText, !isSelected && styles.durationTextDeselected]}>
                {service.durationMinutes} min
              </Text>
            </View>

            {service.price ? (
              <View style={[styles.pricePill, !isSelected && styles.pricePillDeselected]}>
                <Text style={[styles.priceText, !isSelected && styles.priceTextDeselected]}>
                  ${service.price} MXN
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Botón para editar precio o duración */}
        {onEdit && (
          <TouchableOpacity
            testID={`edit-service-btn-${index}`}
            onPress={(e: any) => {
              if (e?.stopPropagation) e.stopPropagation();
              onEdit();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.serviceEditPill}
            accessibilityRole="button"
            accessibilityLabel={`Editar servicio ${service.name}`}
          >
            <SymbolView
              name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
              size={12}
              tintColor="#E07A5F"
            />
            <Text style={styles.serviceEditText}>Editar</Text>
          </TouchableOpacity>
        )}

        {/* Indicador Checkbox interactivo */}
        <View
          style={[
            styles.serviceCheckRing,
            isSelected ? styles.serviceCheckRingSelected : styles.serviceCheckRingDeselected,
          ]}
        >
          {isSelected && (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={13}
              weight="bold"
              tintColor="#FFFFFF"
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Componente interactivo para servicios adicionales / complementos (SCRUM-105)
interface AddonCardItemProps {
  addon: ServiceAddon;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}

const AddonCardItem: React.FC<AddonCardItemProps> = ({
  addon,
  isSelected,
  onToggle,
  index,
}) => {
  const cardScale = useSharedValue(1);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.985, { damping: 14, stiffness: 240 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const webGlass = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: isSelected
      ? '0 0 20px rgba(224, 122, 95, 0.22), 0 4px 18px rgba(0, 0, 0, 0.35)'
      : '0 4px 14px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.22s ease',
    cursor: 'pointer',
  } as any) : {};

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).springify().damping(16).stiffness(130)}
      style={[{ width: '100%' }, animatedStyle]}
    >
      <Pressable
        testID={`addon-card-${addon.id}`}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${addon.name}. ${addon.durationMinutes} minutos adicionales. Precio ${addon.price} MXN`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onToggle}
        style={[
          styles.serviceCard,
          webGlass,
          isSelected ? styles.addonCardSelected : styles.serviceCardDeselected,
        ]}
      >
        <View
          style={[
            styles.serviceIconBox,
            isSelected ? styles.addonIconBoxSelected : styles.serviceIconBoxDeselected,
          ]}
        >
          <SymbolView
            name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
            size={18}
            tintColor={isSelected ? '#E07A5F' : '#4B5563'}
          />
        </View>

        <View style={styles.serviceContent}>
          <View style={styles.addonTitleRow}>
            <Text
              style={[styles.serviceName, !isSelected && styles.serviceNameDeselected]}
            >
              {addon.name}
            </Text>
            {addon.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}
          </View>

          {addon.description ? (
            <Text style={[styles.addonDescText, !isSelected && styles.addonDescTextDeselected]} numberOfLines={2}>
              {addon.description}
            </Text>
          ) : null}

          <View style={styles.serviceMetaRow}>
            <View style={styles.durationPill}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={12}
                tintColor={isSelected ? '#E07A5F' : '#64748B'}
              />
              <Text style={[styles.durationText, isSelected && { color: '#E07A5F' }]}>
                +{addon.durationMinutes} min
              </Text>
            </View>

            <View style={[styles.pricePill, isSelected && styles.addonPricePillSelected]}>
              <Text style={[styles.priceText, isSelected && { color: '#F4F1DE' }]}>
                +${addon.price} MXN
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.serviceCheckRing,
            isSelected ? styles.addonCheckRingSelected : styles.serviceCheckRingDeselected,
          ]}
        >
          {isSelected && (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={13}
              weight="bold"
              tintColor="#FFFFFF"
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Componente de visualización de puestos de atención / sillones (SCRUM-105)
interface StationCardItemProps {
  station: BarberStation;
  index: number;
}

const StationCardItem: React.FC<StationCardItemProps> = ({ station, index }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify().damping(16)}
      style={styles.stationCard}
    >
      <View style={styles.stationIconBox}>
        <SymbolView
          name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
          size={16}
          tintColor="#E07A5F"
        />
      </View>
      <View style={styles.stationContent}>
        <Text style={styles.stationName}>{station.name}</Text>
        <Text style={styles.stationStaff}>
          Personal asignado: {station.assignedStaffName || 'Atención rotativa'}
        </Text>
      </View>
      <View style={styles.stationStatusBadge}>
        <Text style={styles.stationStatusText}>HABILITADO</Text>
      </View>
    </Animated.View>
  );
};

export default function TemplatesCatalogRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sectorId?: string; sectorKey?: string; isCustom?: string }>();

  const { selectedCategory, isCustomCanvas, categories, finalizeOnboarding } = useSectorTemplateStore();

  const isCustomMode = params.isCustom === 'true' || isCustomCanvas || params.sectorKey === 'otro-general';

  // Resuelve canónicamente la categoría actual incluso ante recarga directa de página
  const currentCategory = useMemo(() => {
    if (selectedCategory) return selectedCategory;
    if (params.sectorId) {
      const match = categories.find((c) => c.id.toString() === params.sectorId);
      if (match) return match;
    }
    if (params.sectorKey) {
      const match = categories.find((c) => c.key === params.sectorKey);
      if (match) return match;
    }
    return categories[0] || CANONICAL_SECTOR_CATEGORIES[0];
  }, [selectedCategory, params.sectorId, params.sectorKey, categories]);

  // Lista de servicios sugeridos iniciales
  const categoryServices = useMemo(() => {
    return currentCategory?.suggestedServices ?? [];
  }, [currentCategory]);

  // Lista de servicios editables para la plantilla activa
  const [editableServices, setEditableServices] = useState<SuggestedServiceDto[]>(() =>
    categoryServices.map((s) => ({ ...s }))
  );

  // Lista de servicios adicionales sugeridos para la categoría (ej. Barbería)
  const categoryAddons = useMemo(() => {
    return currentCategory?.suggestedAddons ?? [];
  }, [currentCategory]);

  // IDs de servicios adicionales seleccionados
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(() =>
    (currentCategory?.suggestedAddons ?? [])
      .filter((a) => a.isPopular)
      .map((a) => a.id)
  );

  // Puestos de atención / sillones para la categoría
  const categoryStations = useMemo(() => {
    return currentCategory?.suggestedStations ?? [];
  }, [currentCategory]);

  // Estado para el modal de personalización de servicio
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState<string>('');
  const [editServiceDuration, setEditServiceDuration] = useState<string>('30');
  const [editServicePrice, setEditServicePrice] = useState<string>('');

  // Estado interactivo de servicios seleccionados (pre-seleccionados por defecto)
  const [selectedServices, setSelectedServices] = useState<string[]>(() =>
    categoryServices.map((s) => s.name)
  );

  // Lista de módulos para la categoría actual
  const categoryModuleKeys = useMemo(() => {
    if (isCustomMode) {
      return ['citas', 'servicios', 'empleados', 'recordatorios_sms', 'pagos_linea'];
    }
    return currentCategory?.defaultModules ?? ['citas', 'servicios'];
  }, [isCustomMode, currentCategory]);

  // Estado interactivo de módulos activos (pre-activados por defecto)
  const [activeModules, setActiveModules] = useState<string[]>(() => {
    if (isCustomMode) {
      return ['citas', 'servicios'];
    }
    return currentCategory?.defaultModules ?? ['citas', 'servicios'];
  });

  // Nombre del negocio capturado durante el onboarding (Identidad Visual Adaptable)
  const [businessName, setBusinessName] = useState<string>('');

  // Servicios personalizados creados por el usuario en modo Lienzo Libre o agregados a la plantilla
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('30');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [isAddingService, setIsAddingService] = useState<boolean>(false);

  const handleOpenEditModal = (index: number) => {
    const svc = editableServices[index];
    if (!svc) return;
    setEditingServiceIndex(index);
    setEditServiceName(svc.name);
    setEditServiceDuration(String(svc.durationMinutes));
    setEditServicePrice(svc.price ? String(svc.price) : '');
  };

  const handleSaveEditedService = () => {
    if (editingServiceIndex === null) return;
    const name = editServiceName.trim();
    if (!name) return;
    const dur = parseInt(editServiceDuration, 10);
    if (!dur || dur < 5 || dur > 480) return;
    const pr = editServicePrice ? parseFloat(editServicePrice) : null;

    const oldName = editableServices[editingServiceIndex].name;
    const nextServices = [...editableServices];
    nextServices[editingServiceIndex] = {
      name,
      durationMinutes: dur,
      price: pr,
    };
    setEditableServices(nextServices);

    if (oldName !== name && selectedServices.includes(oldName)) {
      setSelectedServices((prev) => prev.map((n) => (n === oldName ? name : n)));
    }
    setEditingServiceIndex(null);
  };

  const handleRemoveEditedService = () => {
    if (editingServiceIndex === null) return;
    const oldName = editableServices[editingServiceIndex].name;
    setEditableServices((prev) => prev.filter((_, i) => i !== editingServiceIndex));
    setSelectedServices((prev) => prev.filter((n) => n !== oldName));
    setEditingServiceIndex(null);
  };

  const handleAddTemplateService = () => {
    const name = newServiceName.trim();
    if (!name) return;
    const duration = parseInt(newServiceDuration, 10);
    if (!duration || duration < 5 || duration > 480) return;

    const newSvc: SuggestedServiceDto = {
      name,
      durationMinutes: duration,
      price: newServicePrice ? parseFloat(newServicePrice) : null,
    };

    setEditableServices((prev) => [...prev, newSvc]);
    setSelectedServices((prev) => [...prev, name]);
    setNewServiceName('');
    setNewServiceDuration('30');
    setNewServicePrice('');
    setIsAddingService(false);
  };

  const handleAddCustomService = () => {
    const name = newServiceName.trim();
    if (!name) return;
    const duration = parseInt(newServiceDuration, 10);
    if (!duration || duration < 5 || duration > 480) return;

    const newService: CustomService = {
      id: `custom-${Date.now()}`,
      name,
      durationMinutes: duration,
      price: newServicePrice ? parseFloat(newServicePrice) : undefined,
    };

    setCustomServices((prev) => [...prev, newService]);
    setNewServiceName('');
    setNewServiceDuration('30');
    setNewServicePrice('');
    setIsAddingService(false);
  };

  const handleRemoveCustomService = (id: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Sincronización cuando cambia la categoría (ej. al navegar entre giros)
  useEffect(() => {
    if (!isCustomMode && categoryServices.length > 0) {
      setEditableServices(categoryServices.map((s) => ({ ...s })));
      setSelectedServices(categoryServices.map((s) => s.name));
      setSelectedAddonIds(
        (currentCategory?.suggestedAddons ?? [])
          .filter((a) => a.isPopular)
          .map((a) => a.id)
      );
    }
    setActiveModules(
      isCustomMode
        ? ['citas', 'servicios']
        : (currentCategory?.defaultModules ?? ['citas', 'servicios'])
    );
  }, [currentCategory?.id, isCustomMode]);

  // Alterna la selección de un servicio sugerido
  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  // Alterna la activación de un módulo
  const toggleModule = (moduleId: string) => {
    if (moduleId === 'citas' || moduleId === 'citas_grupales') return; // Módulo núcleo obligatorio
    setActiveModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleFinishOnboarding = () => {
    // Resuelve la lista final de servicios según el modo activo:
    // - Modo sector: filtra los servicios sugeridos que el usuario dejó seleccionados
    // - Modo lienzo libre: usa los servicios personalizados creados por el usuario
    const finalServices = isCustomMode
      ? customServices.map((s) => ({
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
        }))
      : editableServices
          .filter((s) => selectedServices.includes(s.name))
          .map((s) => ({
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price ?? undefined,
          }));

    const finalAddons = categoryAddons
      .filter((a) => selectedAddonIds.includes(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        durationMinutes: a.durationMinutes,
        price: a.price,
      }));

    // Persiste el resultado consolidado del onboarding en el store global (US-006 output).
    // Este es el "contrato de salida" que el compañero que implemente el dashboard
    // debe consumir desde useSectorTemplateStore().onboardingResult
    finalizeOnboarding({
      businessName: businessName.trim() || currentCategory.name,
      sectorCategory: currentCategory,
      activeModules,
      finalServices,
      selectedAddons: finalAddons,
      stations: categoryStations,
      isCustomCanvas: isCustomMode,
    });

    router.replace('/(main)');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/sector-selection');
    }
  };

  // Lista formateada de módulos con sus metadatos
  const resolvedModulesList = useMemo(() => {
    return categoryModuleKeys.map((key) => {
      return (
        MODULE_REGISTRY[key] ?? {
          id: key,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          desc: 'Módulo sectorial especializado para optimizar tu agenda.',
        }
      );
    });
  }, [categoryModuleKeys]);

  const webGlass = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as any) : {};

  // Validación: al menos 1 servicio (en modo sector) o al menos 1 módulo (en modo libre)
  const canContinue = isCustomMode
    ? activeModules.length > 0
    : selectedServices.length > 0 || activeModules.length > 0;

  const buttonLabel = businessName.trim()
    ? `Entrar como ${businessName.trim()}`
    : isCustomMode
      ? `Guardar y Entrar a Slotly (${activeModules.length} mód${customServices.length > 0 ? ` • ${customServices.length} serv` : ''})`
      : `Aplicar Plantilla (${selectedServices.length} serv${selectedAddonIds.length > 0 ? ` • ${selectedAddonIds.length} extras` : ''} • ${activeModules.length} mód)`;

  return (
    <SafeAreaView style={styles.outerScreen}>
      <View style={styles.responsiveShell}>
        {/* Orbes de Iluminación Ambiental Cromática */}
        <AmbientGlowOrbs />

        {/* Barra Superior Translúcida con Progreso */}
        <View style={[styles.topBar, webGlass]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Regresar al selector de giro comercial"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
            onPress={handleBack}
          >
            <SymbolView
              name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
              size={18}
              tintColor="#E2E8F0"
            />
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>PASO 02 / 03</Text>
            <View style={styles.stepTrack}>
              <View style={styles.stepProgress} />
            </View>
          </View>

          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header con jerarquía visual humana y anti-cajas */}
          <Animated.View
            entering={FadeInDown.delay(40).springify().damping(16)}
            style={styles.header}
          >
            <View style={styles.kickerBadge}>
              <Text style={styles.kickerText}>
                {isCustomMode ? 'LIENZO MODULAR' : currentCategory.name.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.heading}>
              {isCustomMode
                ? 'Personaliza tu Lienzo Modular'
                : `Plantilla para ${currentCategory.name}`}
            </Text>

            <Text style={styles.subheading}>
              {isCustomMode
                ? 'Configuración flexible sin forzar ningún módulo. Activa o desmarca libremente las funciones para tu negocio.'
                : `Hemos preparado los servicios y módulos óptimos para ${currentCategory.tagline}. Toca cualquier elemento para agregarlo o desmarcarlo.`}
            </Text>

            {/* Resumen dinámico integrado */}
            <View style={styles.summaryBar}>
              {!isCustomMode && (
                <View style={styles.summaryBadge}>
                  <SymbolView
                    name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                    size={14}
                    tintColor="#818CF8"
                  />
                  <Text style={styles.summaryBadgeText}>
                    {selectedServices.length} de {categoryServices.length} servicios listos
                  </Text>
                </View>
              )}

              <View style={styles.summaryBadge}>
                <SymbolView
                  name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
                  size={14}
                  tintColor="#34D399"
                />
                <Text style={styles.summaryBadgeText}>
                  {activeModules.length} módulos habilitados
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Campo de Nombre del Negocio — Identidad Visual Adaptable */}
          <Animated.View
            entering={FadeInDown.delay(100).springify().damping(16)}
            style={styles.nameFieldSection}
          >
            <Text style={styles.nameFieldLabel}>Nombre de tu negocio</Text>
            <Text style={styles.nameFieldSub}>
              Así aparecerá en tu portal y notificaciones para clientes
            </Text>
            <View style={[
              styles.nameInputWrapper,
              Platform.OS === 'web' ? ({
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              } as any) : {},
            ]}>
              <SymbolView
                name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                size={18}
                tintColor={businessName.length > 0 ? '#818CF8' : '#4B5563'}
              />
              <TextInput
                testID="business-name-input"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Ej. Consultorio Dra. Reyes, Studio Flow..."
                placeholderTextColor="#4B5563"
                maxLength={48}
                autoCorrect={false}
                style={[
                  styles.nameInput,
                  Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                ]}
              />
              {businessName.length > 0 && (
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setBusinessName('')}
                >
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                    size={17}
                    tintColor="#475569"
                  />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Sección 1a: Servicios de la Plantilla (Editable para el Administrador) */}
          {!isCustomMode && editableServices.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Servicios de la Plantilla</Text>
                  <Text style={styles.sectionSub}>
                    Toca para activar/desactivar o pulsa "Editar" para modificar precio y duración
                  </Text>
                </View>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>
                    {selectedServices.length} / {editableServices.length}
                  </Text>
                </View>
              </View>

              <View style={styles.servicesList}>
                {editableServices.map((service, index) => (
                  <ServiceCardItem
                    key={`${service.name}-${index}`}
                    service={service}
                    isSelected={selectedServices.includes(service.name)}
                    onToggle={() => toggleService(service.name)}
                    onEdit={() => handleOpenEditModal(index)}
                    index={index}
                  />
                ))}
              </View>

              {/* Botón rápido para agregar servicio adicional a la plantilla */}
              <TouchableOpacity
                testID="add-template-service-button"
                style={[
                  styles.addServiceButton,
                  { marginTop: 12 },
                  Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                ]}
                onPress={() => setIsAddingService((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Agregar nuevo servicio a la plantilla"
              >
                <View style={[styles.addServiceButtonIcon, { backgroundColor: 'rgba(224, 122, 95, 0.15)', borderColor: 'rgba(224, 122, 95, 0.3)' }]}>
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={16}
                    tintColor="#E07A5F"
                  />
                </View>
                <Text style={[styles.addServiceButtonText, { color: '#E07A5F' }]}>
                  {isAddingService ? 'Cerrar formulario' : 'Agregar otro servicio a la plantilla'}
                </Text>
              </TouchableOpacity>

              {isAddingService && (
                <Animated.View
                  entering={FadeInDown.springify().damping(14)}
                  style={[
                    styles.addServiceForm,
                    { borderColor: 'rgba(224, 122, 95, 0.35)' },
                    Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any) : {},
                  ]}
                >
                  <View style={styles.addServiceField}>
                    <Text style={styles.addServiceFieldLabel}>Nombre del nuevo servicio</Text>
                    <TextInput
                      testID="new-template-service-name-input"
                      value={newServiceName}
                      onChangeText={setNewServiceName}
                      placeholder="Ej. Diseño de Barba VIP, Masaje Capilar..."
                      placeholderTextColor="#3D4A5E"
                      maxLength={60}
                      autoCorrect={false}
                      autoFocus
                      style={[
                        styles.addServiceInput,
                        Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                      ]}
                    />
                  </View>

                  <View style={styles.addServiceRow}>
                    <View style={[styles.addServiceField, { flex: 1 }]}>
                      <Text style={styles.addServiceFieldLabel}>Duración (min)</Text>
                      <TextInput
                        testID="new-template-service-duration-input"
                        value={newServiceDuration}
                        onChangeText={setNewServiceDuration}
                        placeholder="30"
                        placeholderTextColor="#3D4A5E"
                        keyboardType="number-pad"
                        maxLength={3}
                        style={[
                          styles.addServiceInput,
                          Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                        ]}
                      />
                    </View>
                    <View style={[styles.addServiceField, { flex: 1 }]}>
                      <Text style={styles.addServiceFieldLabel}>Precio MXN</Text>
                      <TextInput
                        testID="new-template-service-price-input"
                        value={newServicePrice}
                        onChangeText={setNewServicePrice}
                        placeholder="250"
                        placeholderTextColor="#3D4A5E"
                        keyboardType="decimal-pad"
                        maxLength={6}
                        style={[
                          styles.addServiceInput,
                          Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.addServiceActions}>
                    <TouchableOpacity
                      style={styles.addServiceCancel}
                      onPress={() => {
                        setIsAddingService(false);
                        setNewServiceName('');
                        setNewServiceDuration('30');
                        setNewServicePrice('');
                      }}
                    >
                      <Text style={styles.addServiceCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.addServiceSave,
                        { backgroundColor: '#E07A5F' },
                        !newServiceName.trim() && styles.addServiceSaveDisabled,
                      ]}
                      onPress={handleAddTemplateService}
                      disabled={!newServiceName.trim()}
                    >
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={14}
                        tintColor="#FFFFFF"
                      />
                      <Text style={styles.addServiceSaveText}>Guardar en Plantilla</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </View>
          )}

          {/* Sección 1b: Creador de Servicios Personalizados (Solo en modo Lienzo Libre) */}
          {isCustomMode && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Tus Servicios</Text>
                  <Text style={styles.sectionSub}>
                    Crea los servicios que ofrecerás a tus clientes
                  </Text>
                </View>
                {customServices.length > 0 && (
                  <View style={[styles.counterBadge, { borderColor: 'rgba(16, 185, 129, 0.35)', backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Text style={[styles.counterText, { color: '#34D399' }]}>
                      {customServices.length} CREADOS
                    </Text>
                  </View>
                )}
              </View>

              {/* Lista de servicios ya creados */}
              {customServices.length > 0 && (
                <View style={styles.servicesList}>
                  {customServices.map((service, index) => (
                    <Animated.View
                      key={service.id}
                      entering={FadeInDown.delay(index * 40).springify().damping(16)}
                      style={styles.customServiceRow}
                    >
                      {/* Barra de acento esmeralda */}
                      <View style={styles.customServiceAccent} />

                      {/* Contenido del servicio */}
                      <View style={styles.customServiceContent}>
                        <Text style={styles.customServiceName} numberOfLines={1}>
                          {service.name}
                        </Text>
                        <View style={styles.serviceMetaRow}>
                          <View style={styles.durationPill}>
                            <SymbolView
                              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                              size={11}
                              tintColor="#94A3B8"
                            />
                            <Text style={styles.durationText}>{service.durationMinutes} min</Text>
                          </View>
                          {service.price != null && (
                            <View style={styles.pricePill}>
                              <Text style={styles.priceText}>${service.price} MXN</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Botón de eliminar */}
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => handleRemoveCustomService(service.id)}
                        style={styles.customServiceDeleteBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar servicio ${service.name}`}
                      >
                        <SymbolView
                          name={{ ios: 'xmark', android: 'close', web: 'close' }}
                          size={14}
                          tintColor="#64748B"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Formulario de nuevo servicio */}
              {isAddingService ? (
                <Animated.View
                  entering={FadeInDown.springify().damping(14)}
                  style={[
                    styles.addServiceForm,
                    Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any) : {},
                  ]}
                >
                  {/* Nombre del servicio */}
                  <View style={styles.addServiceField}>
                    <Text style={styles.addServiceFieldLabel}>Nombre del servicio</Text>
                    <TextInput
                      testID="new-service-name-input"
                      value={newServiceName}
                      onChangeText={setNewServiceName}
                      placeholder="Ej. Corte de cabello, Consulta..."
                      placeholderTextColor="#3D4A5E"
                      maxLength={60}
                      autoCorrect={false}
                      autoFocus
                      style={[
                        styles.addServiceInput,
                        Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                      ]}
                    />
                  </View>

                  {/* Duración y Precio en fila */}
                  <View style={styles.addServiceRow}>
                    <View style={[styles.addServiceField, { flex: 1 }]}>
                      <Text style={styles.addServiceFieldLabel}>Duración (min)</Text>
                      <TextInput
                        testID="new-service-duration-input"
                        value={newServiceDuration}
                        onChangeText={setNewServiceDuration}
                        placeholder="30"
                        placeholderTextColor="#3D4A5E"
                        keyboardType="number-pad"
                        maxLength={3}
                        style={[
                          styles.addServiceInput,
                          Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                        ]}
                      />
                    </View>
                    <View style={[styles.addServiceField, { flex: 1 }]}>
                      <Text style={styles.addServiceFieldLabel}>Precio MXN (opcional)</Text>
                      <TextInput
                        testID="new-service-price-input"
                        value={newServicePrice}
                        onChangeText={setNewServicePrice}
                        placeholder="250"
                        placeholderTextColor="#3D4A5E"
                        keyboardType="decimal-pad"
                        maxLength={6}
                        style={[
                          styles.addServiceInput,
                          Platform.OS === 'web' ? ({ outline: 'none' } as any) : {},
                        ]}
                      />
                    </View>
                  </View>

                  {/* Botones Guardar / Cancelar */}
                  <View style={styles.addServiceActions}>
                    <TouchableOpacity
                      style={styles.addServiceCancel}
                      onPress={() => {
                        setIsAddingService(false);
                        setNewServiceName('');
                        setNewServiceDuration('30');
                        setNewServicePrice('');
                      }}
                    >
                      <Text style={styles.addServiceCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.addServiceSave,
                        !newServiceName.trim() && styles.addServiceSaveDisabled,
                      ]}
                      onPress={handleAddCustomService}
                      disabled={!newServiceName.trim()}
                    >
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={14}
                        tintColor="#FFFFFF"
                      />
                      <Text style={styles.addServiceSaveText}>Agregar Servicio</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ) : (
                /* Botón de "+ Agregar Servicio" */
                <TouchableOpacity
                  testID="add-custom-service-button"
                  style={[
                    styles.addServiceButton,
                    Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                  ]}
                  onPress={() => setIsAddingService(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar nuevo servicio personalizado"
                >
                  <View style={styles.addServiceButtonIcon}>
                    <SymbolView
                      name={{ ios: 'plus', android: 'add', web: 'add' }}
                      size={16}
                      tintColor="#10B981"
                    />
                  </View>
                  <Text style={styles.addServiceButtonText}>
                    {customServices.length === 0 ? 'Agrega tu primer servicio' : 'Agregar otro servicio'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Sección 1c: Servicios Adicionales / Extras de Barbería (SCRUM-105) */}
          {!isCustomMode && categoryAddons.length > 0 && (
            <View style={[styles.section, { marginTop: 26 }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Servicios Adicionales y Extras</Text>
                  <Text style={styles.sectionSub}>
                    Complementos recomendados para venta cruzada al agendar
                  </Text>
                </View>
                <View style={[styles.counterBadge, { borderColor: 'rgba(224, 122, 95, 0.35)', backgroundColor: 'rgba(224, 122, 95, 0.12)' }]}>
                  <Text style={[styles.counterText, { color: '#E07A5F' }]}>
                    {selectedAddonIds.length} / {categoryAddons.length} ACTIVOS
                  </Text>
                </View>
              </View>

              <View style={styles.servicesList}>
                {categoryAddons.map((addon, index) => (
                  <AddonCardItem
                    key={addon.id}
                    addon={addon}
                    isSelected={selectedAddonIds.includes(addon.id)}
                    onToggle={() => toggleAddon(addon.id)}
                    index={index}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Sección 1d: Sillones y Puestos de Atención (SCRUM-105) */}
          {!isCustomMode && categoryStations.length > 0 && (
            <View style={[styles.section, { marginTop: 26 }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Sillones & Puestos de Atención</Text>
                  <Text style={styles.sectionSub}>
                    Estaciones físicas configuradas para la atención simultánea
                  </Text>
                </View>
                <View style={[styles.counterBadge, { borderColor: 'rgba(224, 122, 95, 0.35)', backgroundColor: 'rgba(224, 122, 95, 0.12)' }]}>
                  <Text style={[styles.counterText, { color: '#E07A5F' }]}>
                    {categoryStations.length} SILLONES
                  </Text>
                </View>
              </View>

              <View style={styles.stationsList}>
                {categoryStations.map((station, index) => (
                  <StationCardItem
                    key={station.id}
                    station={station}
                    index={index}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Sección 2: Módulos Interactivos con FluidToggleSwitch (en ambos modos) */}
          <View style={[styles.section, !isCustomMode && { marginTop: 28 }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>
                  {isCustomMode ? 'Módulos Disponibles' : 'Módulos Recomendados'}
                </Text>
                <Text style={styles.sectionSub}>
                  {isCustomMode
                    ? 'Selecciona las herramientas para tu operación'
                    : 'Puedes apagar o encender cualquier módulo sectorial'}
                </Text>
              </View>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {activeModules.length} ACTIVOS
                </Text>
              </View>
            </View>

            <View style={styles.modulesList}>
              {resolvedModulesList.map((module, index) => (
                <ModuleCardItem
                  key={module.id}
                  module={module}
                  isEnabled={activeModules.includes(module.id)}
                  onToggle={toggleModule}
                  index={index}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Resumen de Confirmación Visual antes del botón final */}
        <View style={[styles.summaryConfirmCard, webGlass]}>
          <View style={styles.summaryConfirmRow}>
            <View style={styles.summaryConfirmItem}>
              <SymbolView
                name={{ ios: 'building.2', android: 'domain', web: 'domain' }}
                size={13}
                tintColor="#6366F1"
              />
              <Text style={styles.summaryConfirmLabel}>
                {businessName.trim() || 'Sin nombre aún'}
              </Text>
            </View>
            <View style={styles.summaryConfirmDivider} />
            {/* En modo sector: muestra servicios sugeridos seleccionados */}
            {!isCustomMode && (
              <>
                <View style={styles.summaryConfirmItem}>
                  <SymbolView
                    name={{ ios: 'tag.fill', android: 'label', web: 'label' }}
                    size={13}
                    tintColor="#818CF8"
                  />
                  <Text style={styles.summaryConfirmLabel}>
                    {selectedServices.length} servicios
                  </Text>
                </View>
                <View style={styles.summaryConfirmDivider} />
                {selectedAddonIds.length > 0 && (
                  <>
                    <View style={styles.summaryConfirmItem}>
                      <SymbolView
                        name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                        size={13}
                        tintColor="#E07A5F"
                      />
                      <Text style={styles.summaryConfirmLabel}>
                        {selectedAddonIds.length} extras
                      </Text>
                    </View>
                    <View style={styles.summaryConfirmDivider} />
                  </>
                )}
              </>
            )}
            {/* En modo Lienzo Libre: muestra servicios custom creados */}
            {isCustomMode && customServices.length > 0 && (
              <>
                <View style={styles.summaryConfirmItem}>
                  <SymbolView
                    name={{ ios: 'tag.fill', android: 'label', web: 'label' }}
                    size={13}
                    tintColor="#34D399"
                  />
                  <Text style={styles.summaryConfirmLabel}>
                    {customServices.length} servicios
                  </Text>
                </View>
                <View style={styles.summaryConfirmDivider} />
              </>
            )}
            <View style={styles.summaryConfirmItem}>
              <SymbolView
                name={{ ios: 'square.grid.2x2', android: 'apps', web: 'apps' }}
                size={13}
                tintColor={isCustomMode ? '#34D399' : '#818CF8'}
              />
              <Text style={styles.summaryConfirmLabel}>
                {activeModules.length} módulos
              </Text>
            </View>
          </View>
        </View>

        {/* Modal Interactivo de Personalización de Servicio (SCRUM-105) */}
        {editingServiceIndex !== null && (
          <View style={styles.editModalOverlay}>
            <View style={[styles.editModalCard, webGlass]}>
              <View style={styles.editModalHeader}>
                <View style={styles.editModalTitleRow}>
                  <SymbolView
                    name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
                    size={18}
                    tintColor="#E07A5F"
                  />
                  <Text style={styles.editModalTitle}>Personalizar Servicio</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingServiceIndex(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={16}
                    tintColor="#94A3B8"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.editModalLabel}>Nombre del Servicio</Text>
              <TextInput
                testID="edit-service-name-input"
                style={styles.editModalInput}
                value={editServiceName}
                onChangeText={setEditServiceName}
                placeholder="Nombre del servicio"
                placeholderTextColor="#475569"
                maxLength={60}
              />

              <Text style={[styles.editModalLabel, { marginTop: 14 }]}>
                Duración del Servicio
              </Text>
              <View style={styles.presetButtonsRow}>
                {[15, 30, 45, 60, 90].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.presetButton,
                      editServiceDuration === String(dur) && styles.presetButtonActive,
                    ]}
                    onPress={() => setEditServiceDuration(String(dur))}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        editServiceDuration === String(dur) && styles.presetButtonTextActive,
                      ]}
                    >
                      {dur}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                testID="edit-service-duration-input"
                style={[styles.editModalInput, { marginTop: 8 }]}
                value={editServiceDuration}
                onChangeText={setEditServiceDuration}
                placeholder="Duración en minutos"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                maxLength={3}
              />

              <Text style={[styles.editModalLabel, { marginTop: 14 }]}>
                Precio Sugerido (MXN)
              </Text>
              <TextInput
                testID="edit-service-price-input"
                style={styles.editModalInput}
                value={editServicePrice}
                onChangeText={setEditServicePrice}
                placeholder="Precio en MXN"
                placeholderTextColor="#475569"
                keyboardType="decimal-pad"
                maxLength={6}
              />

              <View style={styles.editModalActions}>
                <TouchableOpacity
                  style={styles.editModalDeleteBtn}
                  onPress={handleRemoveEditedService}
                >
                  <Text style={styles.editModalDeleteText}>Eliminar</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                  style={styles.editModalCancelBtn}
                  onPress={() => setEditingServiceIndex(null)}
                >
                  <Text style={styles.editModalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editModalSaveBtn}
                  onPress={handleSaveEditedService}
                >
                  <Text style={styles.editModalSaveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Barra de Confirmación Inferior con FluidButton dinámico */}
        <View style={[styles.bottomDock, webGlass]}>
          <FluidButton
            testID="apply-template-button"
            label={buttonLabel}
            variant={isCustomMode ? 'emerald' : 'primary'}
            disabled={!canContinue}
            onPress={handleFinishOnboarding}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerScreen: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  responsiveShell: {
    flex: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    backgroundColor: '#0B0F19',
    position: 'relative',
    minHeight: '100%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: 'rgba(255, 255, 255, 0.08)',
      borderRightColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 0 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.1)',
    } as any),
  },

  topBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    alignItems: 'center',
    gap: 5,
  },
  stepText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 1.2,
  },
  stepTrack: {
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  stepProgress: {
    width: 48,
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 130,
    zIndex: 1,
  },

  header: {
    marginBottom: 24,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
    borderLeftColor: 'rgba(99, 102, 241, 0.3)',
    borderRightColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
    marginBottom: 14,
  },
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },

  section: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#F1F5F9',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  counterBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.28)',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },

  // Servicios Sugeridos Interactivos
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  serviceCardSelected: {
    backgroundColor: 'rgba(20, 26, 42, 0.85)',
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomColor: 'rgba(99, 102, 241, 0.45)',
    borderLeftColor: 'rgba(99, 102, 241, 0.5)',
    borderRightColor: 'rgba(99, 102, 241, 0.5)',
    opacity: 1,
  },
  serviceCardDeselected: {
    backgroundColor: 'rgba(15, 20, 32, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftColor: 'rgba(255, 255, 255, 0.04)',
    borderRightColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.42,
  },
  serviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconBoxSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomColor: 'rgba(99, 102, 241, 0.4)',
    borderLeftColor: 'rgba(99, 102, 241, 0.3)',
    borderRightColor: 'rgba(99, 102, 241, 0.3)',
  },
  serviceIconBoxDeselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  serviceNameDeselected: {
    color: '#94A3B8',
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  durationTextDeselected: {
    color: '#64748B',
  },
  pricePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pricePillDeselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34D399',
  },
  priceTextDeselected: {
    color: '#64748B',
  },
  serviceCheckRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCheckRingSelected: {
    borderColor: '#818CF8',
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  serviceCheckRingDeselected: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  // Módulos Interactivos con FluidToggleSwitch
  modulesList: {
    gap: 10,
  },
  moduleCardWrapper: {
    width: '100%',
  },
  moduleCard: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  moduleCardActive: {
    backgroundColor: 'rgba(20, 26, 42, 0.85)',
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomColor: 'rgba(99, 102, 241, 0.45)',
    borderLeftColor: 'rgba(99, 102, 241, 0.5)',
    borderRightColor: 'rgba(99, 102, 241, 0.5)',
  },
  moduleCardInactive: {
    backgroundColor: 'rgba(15, 20, 32, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftColor: 'rgba(255, 255, 255, 0.04)',
    borderRightColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.55,
  },
  moduleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  moduleNameInactive: {
    color: '#94A3B8',
  },
  moduleDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#94A3B8',
    marginTop: 3,
  },
  moduleDescInactive: {
    color: '#64748B',
  },
  requiredBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },

  // Nombre del negocio
  nameFieldSection: {
    marginBottom: 28,
  },
  nameFieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  nameFieldSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 17,
  },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
    borderLeftColor: 'rgba(99, 102, 241, 0.2)',
    borderRightColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    minHeight: 52,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#F8FAFC',
    letterSpacing: -0.1,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Resumen de confirmación
  summaryConfirmCard: {
    position: 'absolute',
    bottom: Platform.select({ ios: 104, default: 88 }),
    left: 20,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(9, 13, 24, 0.85)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    zIndex: 9,
  },
  summaryConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  summaryConfirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  summaryConfirmLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
    flexShrink: 1,
  },
  summaryConfirmDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.select({ ios: 32, default: 18 }),
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  // Estilos para servicios personalizados en Lienzo Libre
  customServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    borderLeftColor: 'rgba(16, 185, 129, 0.25)',
    borderRightColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingRight: 14,
    marginBottom: 8,
    gap: 0,
  },
  customServiceAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#10B981',
    marginRight: 13,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  customServiceContent: {
    flex: 1,
  },
  customServiceName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F0FDF9',
    letterSpacing: -0.1,
    marginBottom: 5,
  },
  customServiceDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Formulario para agregar servicio
  addServiceForm: {
    backgroundColor: 'rgba(12, 20, 35, 0.75)',
    borderWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.4)',
    borderBottomColor: 'rgba(16, 185, 129, 0.18)',
    borderLeftColor: 'rgba(16, 185, 129, 0.22)',
    borderRightColor: 'rgba(16, 185, 129, 0.22)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addServiceField: {
    gap: 5,
  },
  addServiceFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  addServiceInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 11, default: 10 }),
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
    minHeight: 44,
  },
  addServiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addServiceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  addServiceCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addServiceCancelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  addServiceSave: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#059669',
  },
  addServiceSaveDisabled: {
    backgroundColor: 'rgba(5, 150, 105, 0.35)',
  },
  addServiceSaveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Botón agregar primer servicio
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    marginTop: 4,
  },
  addServiceButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addServiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34D399',
  },

  // Botón y pill de edición en tarjeta de servicio
  serviceEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(224, 122, 95, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.32)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E07A5F',
  },

  // Estilos de servicios adicionales (Addons)
  addonCardSelected: {
    backgroundColor: 'rgba(26, 20, 24, 0.88)',
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomColor: 'rgba(224, 122, 95, 0.45)',
    borderLeftColor: 'rgba(224, 122, 95, 0.65)',
    borderRightColor: 'rgba(224, 122, 95, 0.45)',
    opacity: 1,
  },
  addonIconBoxSelected: {
    backgroundColor: 'rgba(224, 122, 95, 0.20)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomColor: 'rgba(224, 122, 95, 0.4)',
    borderLeftColor: 'rgba(224, 122, 95, 0.3)',
    borderRightColor: 'rgba(224, 122, 95, 0.3)',
  },
  addonPricePillSelected: {
    backgroundColor: 'rgba(224, 122, 95, 0.2)',
    borderColor: 'rgba(224, 122, 95, 0.4)',
  },
  addonCheckRingSelected: {
    backgroundColor: '#E07A5F',
    borderColor: '#E07A5F',
  },
  addonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addonDescText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginBottom: 6,
    lineHeight: 16,
  },
  addonDescTextDeselected: {
    color: '#64748B',
  },
  popularBadge: {
    backgroundColor: 'rgba(224, 122, 95, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.35)',
  },
  popularBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#E07A5F',
    letterSpacing: 0.6,
  },

  // Sillones y Estaciones de Barbería
  stationsList: {
    gap: 8,
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 24, 34, 0.65)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: 'rgba(224, 122, 95, 0.25)',
    borderLeftColor: 'rgba(224, 122, 95, 0.4)',
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  stationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
  },
  stationContent: {
    flex: 1,
  },
  stationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stationStaff: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  stationStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  stationStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.5,
  },

  // Modal de Personalización de Servicio
  editModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(15, 20, 32, 0.95)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomColor: 'rgba(224, 122, 95, 0.35)',
    borderLeftColor: 'rgba(224, 122, 95, 0.25)',
    borderRightColor: 'rgba(224, 122, 95, 0.25)',
    borderRadius: 20,
    padding: 22,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(224, 122, 95, 0.15)',
    } as any),
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editModalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  editModalLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  editModalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    fontSize: 14.5,
    fontWeight: '500',
    color: '#F8FAFC',
    minHeight: 46,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  presetButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: 'rgba(224, 122, 95, 0.22)',
    borderColor: '#E07A5F',
  },
  presetButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  presetButtonTextActive: {
    color: '#E07A5F',
    fontWeight: '700',
  },
  editModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  editModalDeleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  editModalDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  editModalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editModalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  editModalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E07A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
